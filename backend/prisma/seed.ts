import {
  PrismaClient,
  Role,
  EventStatus,
  RegistrationStatus,
  CheckInMethod,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء إضافة البيانات التجريبية...");

  // 1. حذف البيانات القديمة (للتأكد من البدء من الصفر)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.checkInToken.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.eventStaff.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️ تم تنظيف قاعدة البيانات.");

  // 2. تشفير كلمة المرور المشتركة "password123"
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 3. إنشاء المستخدمين
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      passwordHash: hashedPassword,
      name: "مدير النظام",
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ تم إنشاء المدير: ${admin.email}`);

  const organizer = await prisma.user.create({
    data: {
      email: "organizer@example.com",
      passwordHash: hashedPassword,
      name: "منظم الفعاليات",
      role: Role.ORGANIZER,
      isActive: true,
    },
  });
  console.log(`✅ تم إنشاء المنظم: ${organizer.email}`);

  const staff = await prisma.user.create({
    data: {
      email: "staff@example.com",
      passwordHash: hashedPassword,
      name: "موظف التدقيق",
      role: Role.STAFF,
      isActive: true,
    },
  });
  console.log(`✅ تم إنشاء موظف التدقيق: ${staff.email}`);

  // 4. إنشاء فعالية نموذجية
  const event = await prisma.event.create({
    data: {
      title: "معرض التكنولوجيا 2026",
      slug: "tech-expo-2026",
      description:
        "أكبر معرض تكنولوجي في المنطقة، يضم أحدث الابتكارات في الذكاء الاصطناعي والواقع الافتراضي.",
      coverImageUrl: "/uploads/tech-expo-cover.jpg", // مسار مؤقت (سنضيف صوراً لاحقاً)
      location: "مركز المعارض، القاهرة، مصر",
      date: new Date("2026-09-20"),
      startTime: "10:00",
      endTime: "18:00",
      capacity: 100,
      registrationDeadline: new Date("2026-09-15"),
      status: EventStatus.PUBLISHED,
      organizerId: organizer.id,
    },
  });
  console.log(
    `✅ تم إنشاء الفعالية: ${event.title} (السعة: ${event.capacity})`,
  );

  // 5. ربط موظف التدقيق بالفعالية
  await prisma.eventStaff.create({
    data: {
      eventId: event.id,
      staffId: staff.id,
      isActive: true,
    },
  });
  console.log(`✅ تم ربط الموظف ${staff.name} بالفعالية.`);

  // 6. إنشاء 20 تسجيلاً وهمياً (بحالات مختلفة)
  const registrationStatuses = [
    RegistrationStatus.PENDING,
    RegistrationStatus.APPROVED,
    RegistrationStatus.REJECTED,
    RegistrationStatus.APPROVED,
    RegistrationStatus.APPROVED,
    RegistrationStatus.APPROVED,
    RegistrationStatus.APPROVED,
    RegistrationStatus.PENDING,
  ]; // نسب مختلفة لجعل البيانات واقعية

  const registrations = [];
  for (let i = 0; i < 20; i++) {
    const status = registrationStatuses[i % registrationStatuses.length];
    const registration = await prisma.registration.create({
      data: {
        eventId: event.id,
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        organization: faker.company.name(),
        jobTitle: faker.person.jobTitle(),
        status: status,
        approvedAt:
          status === RegistrationStatus.APPROVED
            ? faker.date.between({
                from: new Date("2026-09-01"),
                to: new Date("2026-09-19"),
              })
            : null,
        rejectedAt:
          status === RegistrationStatus.REJECTED
            ? faker.date.between({
                from: new Date("2026-09-01"),
                to: new Date("2026-09-19"),
              })
            : null,
      },
    });
    registrations.push(registration);

    // إذا كانت الحالة APPROVED، ننشئ رمز QR مميزاً
    if (status === RegistrationStatus.APPROVED) {
      await prisma.checkInToken.create({
        data: {
          registrationId: registration.id,
          token: faker.string.uuid(),
        },
      });
    }
  }
  console.log(`✅ تم إنشاء ${registrations.length} تسجيلاً وهمياً.`);

  // 7. إنشاء 5 تسجيلات دخول (Check-in) عشوائية من بين التسجيلات المقبولة
  const approvedRegistrations = registrations.filter(
    (r) => r.status === RegistrationStatus.APPROVED,
  );
  const checkedInCount = Math.min(5, approvedRegistrations.length);

  for (let i = 0; i < checkedInCount; i++) {
    const reg = approvedRegistrations[i];
    if (reg) {
      await prisma.checkIn.create({
        data: {
          registrationId: reg.id,
          method: CheckInMethod.QR_SCAN,
          checkedByUserId: staff.id,
          checkedInAt: faker.date.between({
            from: new Date("2026-09-20T10:00:00"),
            to: new Date("2026-09-20T17:00:00"),
          }),
        },
      });
    }
  }
  console.log(`✅ تم إنشاء ${checkedInCount} تسجيلات دخول وهمية.`);

  // 8. إنشاء بعض الإشعارات للمنظم والموظف
  await prisma.notification.createMany({
    data: [
      {
        userId: organizer.id,
        title: "تسجيل جديد",
        message: `تم تسجيل ${registrations.filter((r) => r.status === RegistrationStatus.PENDING).length} مشاركاً جديداً في انتظار الموافقة.`,
        relatedEntityType: "Event",
        relatedEntityId: event.id,
      },
      {
        userId: organizer.id,
        title: "اقتراب موعد الفعالية",
        message:
          "معرض التكنولوجيا 2026 سيبدأ خلال 3 أيام. تأكد من تجهيز كل شيء.",
        relatedEntityType: "Event",
        relatedEntityId: event.id,
      },
      {
        userId: staff.id,
        title: "تم تعيينك لفعالية",
        message: `تم تعيينك كموظف تدقيق في فعالية "${event.title}". يمكنك الآن استخدام الماسح الضوئي.`,
        relatedEntityType: "Event",
        relatedEntityId: event.id,
      },
    ],
  });
  console.log("✅ تم إنشاء إشعارات وهمية.");

  console.log("🎉 انتهى إضافة البيانات التجريبية بنجاح!");
  console.log("📋 ملخص الحسابات:");
  console.log(`   - Admin:    admin@example.com / password123`);
  console.log(`   - Organizer: organizer@example.com / password123`);
  console.log(`   - Staff:    staff@example.com / password123`);
  console.log(`🔗 رابط الفعالية العامة: /events/tech-expo-2026`);
}

main()
  .catch((e) => {
    console.error("❌ خطأ أثناء إضافة البيانات:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
