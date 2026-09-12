import {
  PrismaClient,
  RegistrationStatus,
  EventStatus,
  CheckInMethod,
} from "@prisma/client";
import { createNotification } from "./notificationService";
import crypto from "crypto";
import {
  registrationApprovedEmail,
  registrationConfirmationEmail,
  registrationRejectedEmail,
  sendEmail,
  waitlistPromotionEmail,
} from "./emailService";

const prisma = new PrismaClient();

type ServiceResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  waitlisted?: boolean;
  code?: string; // ✅ اختياري (لأكواد الأخطاء المحددة)
  checkedInAt?: Date; // ✅ اختياري (لحالة "تم الدخول مسبقاً")
};

// ========== دالة مساعدة داخلية (غير مصدرة) ==========
async function addToWaitlist(data: {
  eventSlug: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
}): Promise<ServiceResult> {
  console.log("🔍 addToWaitlist called for:", data.email);

  const event = await prisma.event.findUnique({
    where: { slug: data.eventSlug },
  });

  if (!event) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  // التحقق من عدم وجود البريد في قائمة الانتظار
  const existingWaitlist = await prisma.waitlist.findUnique({
    where: { eventId_email: { eventId: event.id, email: data.email } },
  });
  if (existingWaitlist) {
    return {
      success: false,
      error: "أنت بالفعل في قائمة الانتظار لهذه الفعالية",
    };
  }

  const waitlistEntry = await prisma.waitlist.create({
    data: {
      eventId: event.id,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      organization: data.organization,
      jobTitle: data.jobTitle,
      status: "WAITING",
    },
  });

  await createNotification({
    userId: event.organizerId,
    type: "waitlist_promotion", // أو 'system' حسب الحاجة
    title: "تسجيل في قائمة الانتظار",
    message: `تم إضافة ${data.fullName} إلى قائمة الانتظار لفعالية "${event.title}"`,
    relatedEntityType: "Event",
    relatedEntityId: event.id,
  });

  console.log("✅ Waitlist entry created:", waitlistEntry.id);

  return {
    success: true,
    data: waitlistEntry,
    message: "تم إضافتك إلى قائمة الانتظار. سيتم إعلامك عند توفر مكان.",
    waitlisted: true,
  };
}

// ========== دوال الخدمة الرئيسية (مصدرة) ==========

export async function registerAttendee(data: {
  eventSlug: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
  ticketTypeId?: string; // ✅ جديد
}): Promise<ServiceResult> {
  console.log("📝 registerAttendee called for:", data.email);

  const event = await prisma.event.findUnique({
    where: { slug: data.eventSlug },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!event) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  // التحقق من حالة الفعالية
  if (
    event.status === EventStatus.CANCELLED ||
    event.status === EventStatus.DRAFT ||
    event.status === EventStatus.COMPLETED
  ) {
    return { success: false, error: "لا يمكن التسجيل في هذه الفعالية حالياً" };
  }

  if (event.status === EventStatus.REGISTRATION_CLOSED) {
    return { success: false, error: "التسجيل في هذه الفعالية مغلق" };
  }

  if (event.status !== EventStatus.PUBLISHED) {
    return { success: false, error: "لا يمكن التسجيل في هذه الفعالية حالياً" };
  }

  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    return { success: false, error: "انتهى الموعد النهائي للتسجيل" };
  }

  // التحقق من عدم تكرار البريد
  const existingRegistration = await prisma.registration.findFirst({
    where: { eventId: event.id, email: data.email },
  });
  if (existingRegistration) {
    return {
      success: false,
      error: "هذا البريد الإلكتروني مسجل بالفعل في هذه الفعالية",
    };
  }

  // التحقق من السعة
  const currentRegistrations = await prisma.registration.count({
    where: { eventId: event.id, status: { not: "REJECTED" } },
  });

  console.log(
    `📊 Current registrations: ${currentRegistrations}, Capacity: ${event.capacity}`,
  );

  if (currentRegistrations >= event.capacity) {
    console.log("⚠️ Capacity full, redirecting to waitlist...");
    // إضافة إلى قائمة الانتظار
    return await addToWaitlist({
      eventSlug: data.eventSlug,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      organization: data.organization,
      jobTitle: data.jobTitle,
    });
  }

  // إنشاء التسجيل (باستخدام Transaction)
  try {
    const registration = await prisma.$transaction(async (tx) => {
      const currentCount = await tx.registration.count({
        where: { eventId: event.id },
      });

      if (currentCount >= event.capacity) {
        throw new Error("CAPACITY_FULL");
      }

      return tx.registration.create({
        data: {
          eventId: event.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          organization: data.organization,
          jobTitle: data.jobTitle,
          ticketTypeId: data.ticketTypeId || null,
          status: RegistrationStatus.PENDING,
        },
      });
    });

    await createNotification({
      userId: event.organizerId,
      type: "registration",
      title: "تسجيل جديد",
      message: `قام ${data.fullName} بالتسجيل في فعالية "${event.title}"`,
      relatedEntityType: "Registration",
      relatedEntityId: registration.id,
      sendEmail: false, // لا نرسل للمنظم، سنرسل للحضور
    });

    // إرسال بريد تأكيد للحضور
    try {
      await sendEmail({
        to: data.email,
        subject: `تأكيد تسجيلك في ${event.title}`,
        html: registrationConfirmationEmail({
          attendeeName: data.fullName,
          eventTitle: event.title,
          eventDate: new Date(event.date).toLocaleDateString("ar-EG"),
          eventLocation: event.location,
          eventUrl: `${process.env.FRONTEND_URL}/event/${event.slug}`,
        }),
      });
    } catch (err) {
      console.error("فشل إرسال بريد التأكيد:", err);
    }
    // التحقق من نوع التذكرة
    let ticketType = null;
    if (data.ticketTypeId) {
      ticketType = await prisma.ticketType.findUnique({
        where: { id: data.ticketTypeId },
        include: {
          _count: { select: { registrations: true } },
        },
      });

      if (
        !ticketType ||
        ticketType.eventId !== event.id ||
        !ticketType.isActive
      ) {
        return { success: false, error: "نوع التذكرة غير صالح" };
      }

      // التحقق من السعة الخاصة بالنوع
      if (
        ticketType.capacity &&
        ticketType._count.registrations >= ticketType.capacity
      ) {
        return { success: false, error: `اكتملت سعة فئة "${ticketType.name}"` };
      }
    }

    return {
      success: true,
      data: registration,
      message: "تم تسجيل طلبك بنجاح. سيتم مراجعته من قبل المنظم.",
      waitlisted: false,
    };
  } catch (error: any) {
    if (error.message === "CAPACITY_FULL") {
      return await addToWaitlist(data);
    }
    console.error("خطأ في تسجيل الحضور:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقاً",
    };
  }
}

// ... باقي الدوال (promoteFromWaitlist, getRegistrationsByEvent, approveRegistration, rejectRegistration, getRegistrationByToken, processCheckIn) تبقى كما هي ...
// (أنا لم أعد كتابتها كلها لتوفير المساحة، لكنها موجودة في ملفك الحالي)
// 2️⃣ إضافة إلى قائمة الانتظار

// 3️⃣ الترقية من قائمة الانتظار
export async function promoteFromWaitlist(
  eventId: string,
): Promise<ServiceResult> {
  const waitlistEntry = await prisma.waitlist.findFirst({
    where: { eventId, status: "WAITING" },
    orderBy: { registeredAt: "asc" },
  });

  if (!waitlistEntry) {
    return { success: false, message: "لا يوجد أشخاص في قائمة الانتظار" };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: { select: { registrations: { where: { status: "APPROVED" } } } },
    },
  });

  if (!event) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  const approvedCount = event._count.registrations;
  if (approvedCount >= event.capacity) {
    return { success: false, message: "لا توجد سعة متاحة حالياً" };
  }

  try {
    const registration = await prisma.$transaction(async (tx) => {
      const newRegistration = await tx.registration.create({
        data: {
          eventId,
          fullName: waitlistEntry.fullName,
          email: waitlistEntry.email,
          phone: waitlistEntry.phone,
          organization: waitlistEntry.organization,
          jobTitle: waitlistEntry.jobTitle,
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });

      await tx.checkInToken.create({
        data: {
          registrationId: newRegistration.id,
          token: crypto.randomUUID(),
        },
      });

      await tx.waitlist.update({
        where: { id: waitlistEntry.id },
        data: { status: "PROMOTED", promotedAt: new Date() },
      });
      await createNotification({
        userId: event.organizerId,
        type: "waitlist_promotion",
        title: "ترقية تلقائية من قائمة الانتظار",
        message: `تم ترقية ${waitlistEntry.fullName} تلقائياً عند توفر مقعد.`,
        relatedEntityType: "Registration",
        relatedEntityId: registration.id,
      });

      return newRegistration;
    });
    try {
      await sendEmail({
        to: waitlistEntry.email,
        subject: `🎉 تمت ترقيتك من قائمة الانتظار - ${event.title}`,
        html: waitlistPromotionEmail({
          attendeeName: waitlistEntry.fullName,
          eventTitle: event.title,
          qrUrl: `${process.env.FRONTEND_URL}/qr/${(await prisma.checkInToken.findUnique({ where: { registrationId: registration.id } }))?.token}`,
        }),
      });
    } catch (err) {
      console.error("فشل إرسال بريد الترقية:", err);
    }

    await createNotification({
      userId: event.organizerId,
      type: "waitlist_promotion",
      title: "تم ترقية من قائمة الانتظار",
      message: `تم ترقية ${waitlistEntry.fullName} من قائمة الانتظار لفعالية "${event.title}"`,
      relatedEntityType: "Registration",
      relatedEntityId: registration.id,
      sendEmail: true,
    });

    return {
      success: true,
      data: registration,
      message: `تم ترقية ${waitlistEntry.fullName} من قائمة الانتظار.`,
    };
  } catch (error) {
    console.error("خطأ في الترقية من قائمة الانتظار:", error);
    return { success: false, error: "حدث خطأ أثناء الترقية من قائمة الانتظار" };
  }
}

// 4️⃣ جلب قائمة التسجيلات لفعالية (خاص بالمنظم)
export async function getRegistrationsByEvent(
  eventId: string,
  organizerId: string,
): Promise<ServiceResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });

  if (!event) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  if (event.organizerId !== organizerId) {
    return {
      success: false,
      error: "ليس لديك صلاحية لعرض تسجيلات هذه الفعالية",
    };
  }

  const registrations = await prisma.registration.findMany({
    where: { eventId },
    include: {
      checkInToken: true,
      checkIn: true,
      ticketType: true,
    },
    orderBy: { registeredAt: "desc" },
  });

  return { success: true, data: registrations };
}

// 5️⃣ الموافقة على تسجيل
export async function approveRegistration(
  registrationId: string,
  organizerId: string,
): Promise<ServiceResult> {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      return { success: false, error: "التسجيل غير موجود" };
    }

    if (registration.event.organizerId !== organizerId) {
      return {
        success: false,
        error: "ليس لديك صلاحية للموافقة على هذا التسجيل",
      };
    }

    if (registration.status !== "PENDING") {
      return { success: false, error: "هذا التسجيل تمت معالجته مسبقاً" };
    }

    const approvedCount = await prisma.registration.count({
      where: { eventId: registration.eventId, status: "APPROVED" },
    });

    if (approvedCount >= registration.event.capacity) {
      return { success: false, error: "لا يمكن الموافقة، اكتملت سعة الفعالية" };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.update({
        where: { id: registrationId },
        data: { status: "APPROVED", approvedAt: new Date() },
      });

      await tx.checkInToken.create({
        data: {
          registrationId: registrationId,
          token: crypto.randomUUID(),
        },
      });

      return reg;
    });
    const checkInToken = await prisma.checkInToken.findUnique({
      where: { registrationId: registrationId },
    });

    try {
      await sendEmail({
        to: registration.email,
        subject: `تمت الموافقة على تسجيلك في ${registration.event.title}`,
        html: registrationApprovedEmail({
          attendeeName: registration.fullName,
          eventTitle: registration.event.title,
          qrUrl: `${process.env.FRONTEND_URL}/qr/${checkInToken?.token}`,
        }),
      });
    } catch (err) {
      console.error("فشل إرسال بريد الموافقة:", err);
    }

    // محاولة ترقية من قائمة الانتظار
    await promoteFromWaitlist(registration.eventId);

    return {
      success: true,
      data: updated,
      message: "تم الموافقة على التسجيل وتوليد رمز QR",
    };
  } catch (error) {
    console.error("خطأ في الموافقة على التسجيل:", error);
    return { success: false, error: "حدث خطأ أثناء الموافقة على التسجيل" };
  }
}

// 6️⃣ رفض تسجيل
export async function rejectRegistration(
  registrationId: string,
  organizerId: string,
): Promise<ServiceResult> {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      return { success: false, error: "التسجيل غير موجود" };
    }

    if (registration.event.organizerId !== organizerId) {
      return { success: false, error: "ليس لديك صلاحية لرفض هذا التسجيل" };
    }

    if (registration.status !== "PENDING") {
      return { success: false, error: "هذا التسجيل تمت معالجته مسبقاً" };
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: "REJECTED", rejectedAt: new Date() },
    });
    try {
      await sendEmail({
        to: registration.email,
        subject: `تم رفض تسجيلك في ${registration.event.title}`,
        html: registrationRejectedEmail({
          attendeeName: registration.fullName,
          eventTitle: registration.event.title,
        }),
      });
    } catch (err) {
      console.error("فشل إرسال بريد الرفض:", err);
    }

    // محاولة ترقية من قائمة الانتظار (لأن مكان قد أصبح متاحاً)
    await promoteFromWaitlist(registration.eventId);

    return {
      success: true,
      data: updated,
      message: "تم رفض التسجيل",
    };
  } catch (error) {
    console.error("خطأ في رفض التسجيل:", error);
    return { success: false, error: "حدث خطأ أثناء رفض التسجيل" };
  }
}

// 7️⃣ جلب بيانات التسجيل عن طريق رمز QR (عام)
export async function getRegistrationByToken(
  token: string,
): Promise<ServiceResult> {
  const checkInToken = await prisma.checkInToken.findUnique({
    where: { token },
    include: {
      registration: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              date: true,
              location: true,
              status: true,
            },
          },
          checkIn: true,
        },
      },
    },
  });

  if (!checkInToken) {
    return { success: false, error: "رمز QR غير صالح" };
  }

  const registration = checkInToken.registration;

  if (registration.status !== "APPROVED") {
    return { success: false, error: "هذا التسجيل غير معتمد" };
  }

  if (registration.event.status === "CANCELLED") {
    return { success: false, error: "الفعالية ملغية" };
  }

  return {
    success: true,
    data: {
      registrationId: registration.id,
      fullName: registration.fullName,
      email: registration.email,
      event: registration.event,
      checkedIn: registration.checkIn ? true : false,
      checkedInAt: registration.checkIn?.checkedInAt || null,
    },
  };
}

// 8️⃣ تسجيل دخول (Check-in) باستخدام رمز QR
export async function processCheckIn(
  token: string,
  eventId: string,
  staffUserId: string,
  gateId?: string,
): Promise<ServiceResult> {
  const checkInToken = await prisma.checkInToken.findUnique({
    where: { token },
    include: {
      registration: {
        include: {
          event: true,
          checkIn: true,
          ticketType: true,
        },
      },
    },
  });

  if (!checkInToken) {
    return {
      success: false,
      error: "رمز QR غير صالح",
      code: "INVALID_TOKEN", // ✅ إضافة code
    };
  }

  const registration = checkInToken.registration;

  // ✅ التحقق من الفعالية (مع code)
  if (registration.eventId !== eventId) {
    return {
      success: false,
      error: "هذا الرمز لا ينتمي إلى هذه الفعالية",
      code: "WRONG_EVENT", // ✅ هذا هو الإصلاح الأساسي
    };
  }

  // ✅ التحقق من الحالة (مع code)
  if (registration.status !== "APPROVED") {
    return {
      success: false,
      error: "هذا التسجيل غير معتمد",
      code: "NOT_APPROVED",
    };
  }

  // ✅ التحقق من الفعالية الملغية
  if (registration.event.status === "CANCELLED") {
    return {
      success: false,
      error: "الفعالية ملغية",
      code: "EVENT_CANCELLED",
    };
  }

  // ✅ التحقق من نوع التذكرة للبوابة (إن وجد)
  if (gateId) {
    const gate = await prisma.gate.findUnique({
      where: { id: gateId },
      include: { allowedTicketTypes: true },
    });

    if (gate && gate.allowedTicketTypes.length > 0) {
      const allowed = gate.allowedTicketTypes.some(
        (t) => t.id === registration.ticketTypeId,
      );
      if (!allowed) {
        return {
          success: false,
          error: `هذه البوابة لا تقبل نوع التذكرة "${
            registration.ticketType?.name || "غير محدد"
          }"`,
          code: "WRONG_TICKET_TYPE",
        };
      }
    }
  }

  // ✅ التحقق من تكرار الدخول (مع code و checkedInAt)
  if (registration.checkIn) {
    return {
      success: false,
      error: "تم تسجيل الدخول مسبقاً",
      code: "ALREADY_CHECKED_IN", // ✅ هذا هو الإصلاح الأساسي
      checkedInAt: registration.checkIn.checkedInAt,
    };
  }

  try {
    const checkIn = await prisma.$transaction(async (tx) => {
      return tx.checkIn.create({
        data: {
          registrationId: registration.id,
          method: CheckInMethod.QR_SCAN,
          checkedByUserId: staffUserId,
          gateId: gateId || null,
        },
        include: {
          registration: {
            include: {
              event: true,
            },
          },
          gate: true,
        },
      });
    });

    return {
      success: true,
      data: {
        attendeeName: checkIn.registration.fullName,
        attendeeEmail: checkIn.registration.email,
        eventTitle: checkIn.registration.event.title,
        checkedInAt: checkIn.checkedInAt,
        gateName: checkIn.gate?.name || null,
      },
      message: "✅ تم تسجيل الدخول بنجاح",
    };
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء تسجيل الدخول",
      code: "SERVER_ERROR",
    };
  }
}
