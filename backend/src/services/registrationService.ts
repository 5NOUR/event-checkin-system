import {
  PrismaClient,
  RegistrationStatus,
  EventStatus,
  CheckInMethod,
} from "@prisma/client";
import { createNotification } from "./notificationService";
import { getIO } from "../sockets/io";

const prisma = new PrismaClient();

// ========== 1. تسجيل حضور جديد (عام - بدون مصادقة) ==========
export async function registerAttendee(data: {
  eventSlug: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
}) {
  // 1. البحث عن الفعالية باستخدام الـ slug
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

  // 2. التحقق من حالة الفعالية
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

  // 3. التحقق من الموعد النهائي للتسجيل
  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    return { success: false, error: "انتهى الموعد النهائي للتسجيل" };
  }

  // 4. التحقق من السعة
  const currentRegistrations = event._count.registrations;
  if (currentRegistrations >= event.capacity) {
    return { success: false, error: "عذراً، لقد اكتملت سعة الفعالية" };
  }

  // 5. التحقق من عدم تكرار البريد الإلكتروني
  const existingRegistration = await prisma.registration.findFirst({
    where: {
      eventId: event.id,
      email: data.email,
    },
  });

  if (existingRegistration) {
    return {
      success: false,
      error: "هذا البريد الإلكتروني مسجل بالفعل في هذه الفعالية",
    };
  }

  // 6. إنشاء التسجيل باستخدام Transaction
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
          status: RegistrationStatus.PENDING,
        },
      });
    });

    // 📢 إشعار للمنظم
    await createNotification(
      event.organizerId,
      "تسجيل جديد",
      `قام ${data.fullName} بالتسجيل في فعالية "${event.title}"`,
      "Registration",
      registration.id,
    );

    return {
      success: true,
      data: registration,
      message: "تم تسجيل طلبك بنجاح. سيتم مراجعته من قبل المنظم.",
    };
  } catch (error: any) {
    if (error.message === "CAPACITY_FULL") {
      return {
        success: false,
        error: "عذراً، لقد اكتملت سعة الفعالية أثناء معالجة طلبك",
      };
    }
    console.error("خطأ في تسجيل الحضور:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقاً",
    };
  }
}

// ========== 2. جلب قائمة التسجيلات لفعالية (خاص بالمنظم) ==========
export async function getRegistrationsByEvent(
  eventId: string,
  organizerId: string,
) {
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
    },
    orderBy: { registeredAt: "desc" },
  });

  return { success: true, data: registrations };
}

// ========== 3. الموافقة على تسجيل (مع توليد QR) ==========
export async function approveRegistration(
  registrationId: string,
  organizerId: string,
) {
  return await prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
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

    const currentCount = await tx.registration.count({
      where: {
        eventId: registration.eventId,
        status: "APPROVED",
      },
    });

    if (currentCount >= registration.event.capacity) {
      return { success: false, error: "لا يمكن الموافقة، اكتملت سعة الفعالية" };
    }

    const updated = await tx.registration.update({
      where: { id: registrationId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    const token = await tx.checkInToken.create({
      data: {
        registrationId: registrationId,
        token: crypto.randomUUID(),
      },
    });

    // 📢 إشعار للمنظم
    await createNotification(
      registration.event.organizerId,
      "تمت الموافقة على تسجيل",
      `تمت الموافقة على تسجيل ${registration.fullName} في فعالية "${registration.event.title}"`,
      "Registration",
      registrationId,
    );

    return {
      success: true,
      data: { ...updated, checkInToken: token },
      message: "تم الموافقة على التسجيل وتوليد رمز QR",
    };
  });
}

// ========== 4. رفض تسجيل ==========
export async function rejectRegistration(
  registrationId: string,
  organizerId: string,
) {
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
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
    },
  });

  // 📢 إشعار للمنظم
  await createNotification(
    registration.event.organizerId,
    "تم رفض تسجيل",
    `تم رفض تسجيل ${registration.fullName} في فعالية "${registration.event.title}"`,
    "Registration",
    registrationId,
  );

  return {
    success: true,
    data: updated,
    message: "تم رفض التسجيل",
  };
}

// ========== 5. جلب بيانات التسجيل عن طريق رمز QR (عام) ==========
export async function getRegistrationByToken(token: string) {
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
          checkIn: true, // ✅ لإظهار حالة الدخول
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

  const eventDate = new Date(registration.event.date);
  if (eventDate < new Date() && registration.event.status !== "ONGOING") {
    return { success: false, error: "انتهت الفعالية" };
  }

  return {
    success: true,
    data: {
      registrationId: registration.id,
      fullName: registration.fullName,
      email: registration.email,
      event: {
        id: registration.event.id,
        title: registration.event.title,
        slug: registration.event.slug,
        date: registration.event.date,
        location: registration.event.location,
        status: registration.event.status,
      },
      checkedIn: registration.checkIn ? true : false,
      checkedInAt: registration.checkIn?.checkedInAt || null,
    },
  };
}

// ========== 6. تسجيل الدخول (Check-in) باستخدام رمز QR (خاص بالموظفين) ==========
export async function processCheckIn(
  token: string,
  eventId: string,
  staffUserId: string,
) {
  const checkInToken = await prisma.checkInToken.findUnique({
    where: { token },
    include: {
      registration: {
        include: {
          event: true,
          checkIn: true,
        },
      },
    },
  });

  if (!checkInToken) {
    return { success: false, error: "رمز QR غير صالح" };
  }

  const registration = checkInToken.registration;

  if (registration.eventId !== eventId) {
    return {
      success: false,
      error: "هذا الرمز لا ينتمي إلى هذه الفعالية",
      code: "WRONG_EVENT",
    };
  }

  if (registration.status !== "APPROVED") {
    return {
      success: false,
      error: "هذا التسجيل غير معتمد",
      code: "NOT_APPROVED",
    };
  }

  if (registration.event.status === "CANCELLED") {
    return { success: false, error: "الفعالية ملغية" };
  }

  if (registration.checkIn) {
    return {
      success: false,
      error: "تم تسجيل الدخول مسبقاً",
      code: "ALREADY_CHECKED_IN",
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
        },
        include: {
          registration: {
            include: {
              event: true,
            },
          },
        },
      });
    });

    // 📡 إرسال تحديث لحظي عبر Socket.IO
    const socketIO = getIO();
    const room = `event:${eventId}`;
    const emitData = {
      registrationId: registration.id,
      attendeeName: registration.fullName,
      eventId: eventId,
      checkedInAt: checkIn.checkedInAt,
    };
    socketIO.to(room).emit("checkin-update", emitData);
    console.log(
      `📡 Emitted checkin-update to room ${room} for attendee ${registration.fullName}`,
    );

    // 📢 إشعار للمنظم (اختياري)
    await createNotification(
      registration.event.organizerId,
      "دخول جديد",
      `قام ${registration.fullName} بالدخول إلى فعالية "${registration.event.title}"`,
      "CheckIn",
      checkIn.id,
    );

    return {
      success: true,
      data: {
        attendeeName: checkIn.registration.fullName,
        attendeeEmail: checkIn.registration.email,
        eventTitle: checkIn.registration.event.title,
        checkedInAt: checkIn.checkedInAt,
      },
      message: "✅ تم تسجيل الدخول بنجاح",
    };
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error);
    return { success: false, error: "حدث خطأ أثناء تسجيل الدخول" };
  }
}
