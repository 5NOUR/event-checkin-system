import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 1. جلب قائمة الموظفين المعينين لفعالية معينة
export async function getEventStaff(eventId: string, organizerId: string) {
  // التحقق من ملكية الفعالية
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });

  if (!event) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  if (event.organizerId !== organizerId) {
    return { success: false, error: "ليس لديك صلاحية لعرض موظفي هذه الفعالية" };
  }

  const staffList = await prisma.eventStaff.findMany({
    where: { eventId },
    include: {
      staff: {
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  return { success: true, data: staffList };
}

// 2. إضافة موظف إلى فعالية (عن طريق البريد الإلكتروني)
export async function addStaffToEvent(
  eventId: string,
  organizerId: string,
  email: string,
  name: string,
) {
  // التحقق من ملكية الفعالية
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
      error: "ليس لديك صلاحية لإضافة موظفين لهذه الفعالية",
    };
  }

  // البحث عن المستخدم بالبريد الإلكتروني
  let user = await prisma.user.findUnique({
    where: { email },
  });

  // إذا لم يوجد المستخدم، نقوم بإنشائه كـ STAFF
  if (!user) {
    const temporaryPassword = Math.random().toString(36).slice(-8); // كلمة مرور مؤقتة
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: name || email.split("@")[0],
        role: Role.STAFF,
        isActive: true,
      },
    });

    // TODO: في الإصدار القادم، سنرسل بريداً إلكترونياً يحتوي على كلمة المرور المؤقتة
    console.log(
      `🔑 تم إنشاء مستخدم جديد: ${email} | كلمة المرور المؤقتة: ${temporaryPassword}`,
    );
  }

  // التحقق من أن المستخدم ليس منظمًا أو مديرًا (لن نسمح بإضافة مدير كموظف)
  if (user.role === Role.ADMIN) {
    return { success: false, error: "لا يمكن إضافة مدير النظام كموظف تدقيق" };
  }

  // التحقق من أن المستخدم ليس منظمًا لهذه الفعالية (لا يمكن إضافة المنظم نفسه)
  if (user.id === organizerId) {
    return { success: false, error: "لا يمكن إضافة المنظم نفسه كموظف" };
  }

  // التحقق من أن المستخدم ليس مضافًا بالفعل لهذه الفعالية
  const existingAssignment = await prisma.eventStaff.findUnique({
    where: {
      eventId_staffId: {
        eventId,
        staffId: user.id,
      },
    },
  });

  if (existingAssignment) {
    return { success: false, error: "هذا الموظف مضاف بالفعل لهذه الفعالية" };
  }

  // إضافة المستخدم كموظف في الفعالية
  const assignment = await prisma.eventStaff.create({
    data: {
      eventId,
      staffId: user.id,
      isActive: true,
    },
    include: {
      staff: {
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  // إنشاء إشعار للموظف الجديد
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "تم تعيينك كموظف تدقيق",
      message: `تم تعيينك كموظف تدقيق في فعالية "${eventId}" (يمكنك الآن استخدام الماسح الضوئي).`,
      relatedEntityType: "Event",
      relatedEntityId: eventId,
    },
  });

  return { success: true, data: assignment };
}

// 3. تعطيل موظف (إزالة صلاحيته من الفعالية)
export async function removeStaffFromEvent(
  eventId: string,
  organizerId: string,
  staffId: string,
) {
  // التحقق من ملكية الفعالية
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
      error: "ليس لديك صلاحية لإزالة موظفين من هذه الفعالية",
    };
  }

  // التحقق من وجود التعيين
  const assignment = await prisma.eventStaff.findUnique({
    where: {
      eventId_staffId: {
        eventId,
        staffId,
      },
    },
  });

  if (!assignment) {
    return { success: false, error: "هذا الموظف غير معين لهذه الفعالية" };
  }

  // إما حذف التعيين أو تعطيله (نفضل التعطيل للاحتفاظ بالسجل)
  // سنقوم بتعطيل isActive بدلاً من الحذف
  const updated = await prisma.eventStaff.update({
    where: {
      eventId_staffId: {
        eventId,
        staffId,
      },
    },
    data: { isActive: false },
    include: {
      staff: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return { success: true, data: updated };
}

// 4. إعادة تفعيل موظف
export async function reactivateStaff(
  eventId: string,
  organizerId: string,
  staffId: string,
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
      error: "ليس لديك صلاحية لإعادة تفعيل موظفين في هذه الفعالية",
    };
  }

  const assignment = await prisma.eventStaff.findUnique({
    where: {
      eventId_staffId: {
        eventId,
        staffId,
      },
    },
  });

  if (!assignment) {
    return { success: false, error: "هذا الموظف غير معين لهذه الفعالية" };
  }

  const updated = await prisma.eventStaff.update({
    where: {
      eventId_staffId: {
        eventId,
        staffId,
      },
    },
    data: { isActive: true },
    include: {
      staff: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return { success: true, data: updated };
}
