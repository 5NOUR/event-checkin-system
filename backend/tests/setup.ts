import { beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";

// ✅ فرض تحميل .env.test قبل أي شيء آخر
process.env.DATABASE_URL =
  "postgresql://eventadmin:securepassword123@localhost:5432/eventdb_test";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-testing-only";
process.env.EMAIL_PROVIDER = "console";

// ✅ إنشاء Prisma Client بعد ضبط المتغيرات
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// تحقق من قاعدة البيانات المستخدمة
beforeAll(async () => {
  console.log("🧪 Starting tests");
  console.log("📊 DATABASE_URL:", process.env.DATABASE_URL);

  // ✅ تأكيد إضافي: يجب أن ينتهي بـ eventdb_test
  if (!process.env.DATABASE_URL?.includes("eventdb_test")) {
    throw new Error(
      '❌ خطأ حرج: الاختبارات يجب أن تعمل على قاعدة بيانات "eventdb_test" وليس "eventdb"!',
    );
  }

  await prisma.$connect();
});

// بعد كل اختبار - تنظيف البيانات
beforeEach(async () => {
  // ترتيب الحذف مهم بسبب Foreign Keys
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.checkInToken.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.eventStaffGate.deleteMany();
  await prisma.eventStaff.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.agendaItem.deleteMany();
  await prisma.speaker.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.gate.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
});

// بعد كل الاختبارات
afterAll(async () => {
  await prisma.$disconnect();
});
