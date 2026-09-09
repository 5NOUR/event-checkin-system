import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// تعريف واجهة لبيانات التصدير
export interface ExportRecord {
  "الاسم الكامل": string;
  "البريد الإلكتروني": string;
  "رقم الهاتف": string;
  "الجهة / الجامعة": string;
  "المسمى الوظيفي": string;
  "حالة التسجيل": string;
  "وقت التسجيل": string;
  "حالة الدخول": string;
  "وقت الدخول": string;
}

export interface ExportData {
  eventTitle: string;
  records: ExportRecord[];
  total: number;
}

export interface ExportResult {
  success: boolean;
  data?: ExportData;
  error?: string;
}

export async function exportEventRegistrations(
  eventId: string,
  organizerId: string,
): Promise<ExportResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, title: true },
  });

  if (!event) {
    return { success: false, error: "الفعالية غير موجودة" };
  }

  if (event.organizerId !== organizerId) {
    return {
      success: false,
      error: "ليس لديك صلاحية لتصدير بيانات هذه الفعالية",
    };
  }

  const registrations = await prisma.registration.findMany({
    where: { eventId },
    include: {
      checkIn: true,
    },
    orderBy: { registeredAt: "asc" },
  });

  const records: ExportRecord[] = registrations.map((reg) => ({
    "الاسم الكامل": reg.fullName,
    "البريد الإلكتروني": reg.email,
    "رقم الهاتف": reg.phone || "",
    "الجهة / الجامعة": reg.organization || "",
    "المسمى الوظيفي": reg.jobTitle || "",
    "حالة التسجيل":
      reg.status === "PENDING"
        ? "معلق"
        : reg.status === "APPROVED"
          ? "مقبول"
          : "مرفوض",
    "وقت التسجيل": reg.registeredAt.toLocaleString("ar-EG"),
    "حالة الدخول": reg.checkIn ? "تم الدخول" : "لم يدخل",
    "وقت الدخول": reg.checkIn
      ? reg.checkIn.checkedInAt.toLocaleString("ar-EG")
      : "",
  }));

  return {
    success: true,
    data: {
      eventTitle: event.title,
      records,
      total: records.length,
    },
  };
}
