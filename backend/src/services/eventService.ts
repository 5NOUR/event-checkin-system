import { PrismaClient, EventStatus, Role } from "@prisma/client";
import slugify from "slug";

const prisma = new PrismaClient();

// دالة مساعدة لتوليد slug فريد
async function generateUniqueSlug(title: string): Promise<string> {
  let baseSlug = slugify(title, { lower: true, replacement: "-" });
  // إزالة أي أحرف غير مسموح بها
  baseSlug = baseSlug.replace(/[^a-z0-9\-]/g, "");

  let slug = baseSlug;
  let counter = 1;

  // التحقق من وجود slug في قاعدة البيانات، وإضافة رقم إذا كان موجوداً
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// 1. إنشاء فعالية جديدة
export async function createEvent(data: {
  title: string;
  description: string;
  location: string;
  date: Date;
  startTime: string;
  endTime: string;
  capacity: number;
  registrationDeadline?: Date;
  coverImageUrl?: string;
  organizerId: string;
}) {
  const slug = await generateUniqueSlug(data.title);

  return prisma.event.create({
    data: {
      ...data,
      slug,
      status: EventStatus.DRAFT, // الحالة الافتراضية
    },
  });
}

// 2. جلب قائمة الفعاليات لمنظم معين
export async function getEventsByOrganizer(organizerId: string) {
  return prisma.event.findMany({
    where: { organizerId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });
}

// 3. جلب تفاصيل فعالية معينة (مع التحقق من الملكية)
export async function getEventById(
  eventId: string,
  userId: string,
  userRole: Role,
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!event) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  // التحقق من الصلاحية: إذا كان المستخدم ليس مديراً، يجب أن يكون هو منظم الفعالية
  if (userRole !== Role.ADMIN && event.organizerId !== userId) {
    return { success: false, error: "ليس لديك صلاحية لعرض هذه الفعالية" };
  }

  return { success: true, data: event };
}

// 4. تحديث فعالية
export async function updateEvent(
  eventId: string,
  userId: string,
  userRole: Role,
  data: any,
) {
  // أولاً: التأكد من وجود الفعالية وملكيتها
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  if (userRole !== Role.ADMIN && existing.organizerId !== userId) {
    return { success: false, error: "ليس لديك صلاحية لتعديل هذه الفعالية" };
  }

  // إذا تم تغيير العنوان، يجب تحديث الـ slug
  let updateData = { ...data };
  if (data.title && data.title !== existing.title) {
    const newSlug = await generateUniqueSlug(data.title);
    updateData.slug = newSlug;
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: updateData,
  });

  return { success: true, data: updated };
}

// 5. تغيير حالة الفعالية (نشر، إلغاء، إلخ)
export async function updateEventStatus(
  eventId: string,
  userId: string,
  userRole: Role,
  status: EventStatus,
) {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  if (userRole !== Role.ADMIN && existing.organizerId !== userId) {
    return {
      success: false,
      error: "ليس لديك صلاحية لتغيير حالة هذه الفعالية",
    };
  }

  // منع التحويلات غير المنطقية (مثلاً: من CANCELLED إلى DRAFT)
  if (
    existing.status === EventStatus.CANCELLED &&
    status !== EventStatus.CANCELLED
  ) {
    return { success: false, error: "لا يمكن إلغاء إلغاء فعالية ملغية" };
  }
  if (
    existing.status === EventStatus.COMPLETED &&
    status !== EventStatus.COMPLETED
  ) {
    return { success: false, error: "لا يمكن تعديل حالة فعالية منتهية" };
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status },
  });

  return { success: true, data: updated };
}

// 6. جلب تفاصيل فعالية عامة (بدون مصادقة) باستخدام slug
export async function getPublicEventBySlug(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      organizer: { select: { name: true, email: true } },
      speakers: { orderBy: { order: "asc" } },
      agendaItems: { orderBy: { order: "asc" }, include: { speaker: true } },
      faqs: { orderBy: { order: "asc" } },
      sponsors: { orderBy: { order: "asc" } },
      galleryImages: { orderBy: { order: "asc" } },
      gates: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
      _count: { select: { registrations: true } },
      ticketTypes: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!event) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  const remainingCapacity = event.capacity - event._count.registrations;

  return {
    success: true,
    data: {
      ...event,
      remainingCapacity,
    },
  };
}
// 7. جلب إحصائيات التسجيل لفعالية
export async function getEventStats(eventId: string, organizerId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!event) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  if (event.organizerId !== organizerId) {
    return {
      success: false,
      error: "ليس لديك صلاحية لعرض إحصائيات هذه الفعالية",
    };
  }

  // جلب عدد التسجيلات حسب الحالة
  const counts = await prisma.registration.groupBy({
    by: ["status"],
    where: { eventId },
    _count: true,
  });

  const stats = {
    total: event._count.registrations,
    pending: 0,
    approved: 0,
    rejected: 0,
    checkedIn: 0,
  };

  counts.forEach((item) => {
    if (item.status === "PENDING") stats.pending = item._count;
    else if (item.status === "APPROVED") stats.approved = item._count;
    else if (item.status === "REJECTED") stats.rejected = item._count;
  });

  // جلب عدد الذين دخلوا فعلياً (checked in)
  const checkedInCount = await prisma.checkIn.count({
    where: {
      registration: {
        eventId: eventId,
      },
    },
  });
  stats.checkedIn = checkedInCount;

  return { success: true, data: stats };
}
// 8. جلب تحليلات متقدمة لفعالية
export async function getEventAnalytics(eventId: string, organizerId: string) {
  // التحقق من ملكية الفعالية
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!event) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  if (event.organizerId !== organizerId) {
    return {
      success: false,
      error: "ليس لديك صلاحية لعرض تحليلات هذه الفعالية",
    };
  }

  // 1. عدد التسجيلات حسب الحالة
  const statusCounts = await prisma.registration.groupBy({
    by: ["status"],
    where: { eventId },
    _count: true,
  });

  const statusMap = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  };

  statusCounts.forEach((item) => {
    if (item.status === "PENDING") statusMap.PENDING = item._count;
    else if (item.status === "APPROVED") statusMap.APPROVED = item._count;
    else if (item.status === "REJECTED") statusMap.REJECTED = item._count;
  });

  // 2. عدد الذين دخلوا بالفعل
  const checkedInCount = await prisma.checkIn.count({
    where: {
      registration: {
        eventId: eventId,
      },
    },
  });

  // 3. نشاط الدخول على مدار الساعة (كل ساعة)
  const checkIns = await prisma.checkIn.findMany({
    where: {
      registration: {
        eventId: eventId,
      },
    },
    select: {
      checkedInAt: true,
    },
    orderBy: {
      checkedInAt: "asc",
    },
  });

  // تجميع الدخول حسب الساعة
  const hourlyActivity: { hour: number; count: number }[] = [];
  const hourMap = new Map<number, number>();

  checkIns.forEach((checkIn) => {
    const hour = new Date(checkIn.checkedInAt).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  // تحويل الخريطة إلى مصفوفة مرتبة
  for (let i = 0; i < 24; i++) {
    hourlyActivity.push({
      hour: i,
      count: hourMap.get(i) || 0,
    });
  }

  // 4. آخر 10 عمليات دخول
  const recentCheckIns = await prisma.checkIn.findMany({
    where: {
      registration: {
        eventId: eventId,
      },
    },
    include: {
      registration: {
        select: {
          fullName: true,
          email: true,
        },
      },
      checkedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      checkedInAt: "desc",
    },
    take: 10,
  });
  const gateActivity = await prisma.checkIn.groupBy({
    by: ["gateId"],
    where: {
      registration: { eventId: eventId },
      gateId: { not: null },
    },
    _count: true,
  });

  // جلب أسماء البوابات
  const gatesWithCounts = await Promise.all(
    gateActivity.map(async (item) => {
      const gate = await prisma.gate.findUnique({
        where: { id: item.gateId! },
        select: { name: true },
      });
      return {
        gateName: gate?.name || "غير معروفة",
        count: item._count,
      };
    }),
  );

  return {
    success: true,
    data: {
      totalRegistrations: event._count.registrations,
      pending: statusMap.PENDING,
      approved: statusMap.APPROVED,
      rejected: statusMap.REJECTED,
      checkedIn: checkedInCount,
      gateActivity: gatesWithCounts,
      remainingCapacity: event.capacity - checkedInCount,
      attendanceRate:
        event._count.registrations > 0
          ? Math.round((checkedInCount / event._count.registrations) * 100)
          : 0,
      hourlyActivity,
      recentCheckIns: recentCheckIns.map((ci) => ({
        attendeeName: ci.registration.fullName,
        attendeeEmail: ci.registration.email,
        checkedInAt: ci.checkedInAt,
        checkedBy: ci.checkedBy.name,
        method: ci.method,
      })),
    },
  };
}
