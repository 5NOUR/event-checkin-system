import {
  PrismaClient,
  Role,
  EventStatus,
  RegistrationStatus,
  CheckInMethod,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء ملء قاعدة البيانات...\n");

  // ========== 1. تنظيف قاعدة البيانات ==========
  console.log("🗑️  تنظيف البيانات القديمة...");
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
  console.log("✅ تم التنظيف.\n");

  // ========== 2. كلمة المرور المشتركة ==========
  const passwordHash = await bcrypt.hash("password123", 10);

  // ========== 3. المستخدمون ==========
  console.log("👤 إنشاء المستخدمين...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      passwordHash,
      name: "مدير النظام",
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: "organizer@example.com",
      passwordHash,
      name: "أحمد محمد",
      role: Role.ORGANIZER,
      isActive: true,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@example.com",
      passwordHash,
      name: "سارة علي",
      role: Role.STAFF,
      isActive: true,
    },
  });

  console.log(`✅ admin@example.com`);
  console.log(`✅ organizer@example.com`);
  console.log(`✅ staff@example.com\n`);

  // ========== 4. الفعالية الرئيسية ==========
  console.log("📅 إنشاء الفعالية...");
  const event = await prisma.event.create({
    data: {
      title: "معرض التكنولوجيا 2026",
      slug: "tech-expo-2026",
      description:
        "أكبر معرض تكنولوجي في المنطقة، يضم أحدث الابتكارات في الذكاء الاصطناعي والواقع الافتراضي وإنترنت الأشياء. انضم إلينا لاستكشاف مستقبل التكنولوجيا مع نخبة من الخبراء والمبتكرين.",
      coverImageUrl: null,
      location: "مركز القاهرة الدولي للمؤتمرات، مدينة نصر",
      date: new Date("2026-12-15T09:00:00Z"),
      startTime: "09:00",
      endTime: "18:00",
      capacity: 100,
      registrationDeadline: new Date("2026-12-10T23:59:59Z"),
      status: EventStatus.PUBLISHED,
      organizerId: organizer.id,
    },
  });
  console.log(`✅ ${event.title}\n`);

  // ========== 5. ربط الموظف بالفعالية ==========
  await prisma.eventStaff.create({
    data: {
      eventId: event.id,
      staffId: staff.id,
      isActive: true,
    },
  });
  console.log("✅ تم ربط الموظف بالفعالية.\n");

  // ========== 6. البوابات ==========
  console.log("🚪 إنشاء البوابات...");
  const gateMain = await prisma.gate.create({
    data: {
      eventId: event.id,
      name: "البوابة الرئيسية",
      location: "المدخل الجنوبي",
      isActive: true,
      order: 0,
    },
  });

  const gateVip = await prisma.gate.create({
    data: {
      eventId: event.id,
      name: "بوابة VIP",
      location: "المدخل الشمالي - الطابق الثاني",
      isActive: true,
      order: 1,
    },
  });
  console.log("✅ البوابة الرئيسية");
  console.log("✅ بوابة VIP\n");

  // ========== 7. أنواع التذاكر ==========
  console.log("🎫 إنشاء أنواع التذاكر...");
  const ticketStandard = await prisma.ticketType.create({
    data: {
      eventId: event.id,
      name: "Standard",
      description: "تذكرة دخول عام لجميع الجلسات",
      color: "#6B6B68",
      capacity: 70,
      isActive: true,
      order: 0,
    },
  });

  const ticketVip = await prisma.ticketType.create({
    data: {
      eventId: event.id,
      name: "VIP",
      description: "تذكرة مميزة مع دخول حصري للمنطقة الخاصة",
      color: "#B08D57",
      capacity: 20,
      isActive: true,
      order: 1,
    },
  });

  const ticketStudent = await prisma.ticketType.create({
    data: {
      eventId: event.id,
      name: "Student",
      description: "تذكرة مخفضة للطلاب",
      color: "#3B82F6",
      capacity: 10,
      isActive: true,
      order: 2,
    },
  });
  console.log("✅ Standard (70)");
  console.log("✅ VIP (20)");
  console.log("✅ Student (10)\n");

  // ========== 8. ربط البوابات بالأنواع ==========
  await prisma.gate.update({
    where: { id: gateMain.id },
    data: {
      allowedTicketTypes: {
        connect: [{ id: ticketStandard.id }, { id: ticketStudent.id }],
      },
    },
  });

  await prisma.gate.update({
    where: { id: gateVip.id },
    data: {
      allowedTicketTypes: {
        connect: [{ id: ticketVip.id }],
      },
    },
  });
  console.log("✅ تم ربط البوابات بأنواع التذاكر.\n");

  // ========== 9. المتحدثون ==========
  console.log("🎤 إنشاء المتحدثين...");
  const speaker1 = await prisma.speaker.create({
    data: {
      eventId: event.id,
      name: "د. محمد الشريف",
      title: "خبير الذكاء الاصطناعي",
      bio: "أستاذ في جامعة القاهرة، متخصص في تعلم الآلة والذكاء الاصطناعي مع أكثر من 15 عاماً من الخبرة.",
      imageUrl: null,
      order: 0,
    },
  });

  const speaker2 = await prisma.speaker.create({
    data: {
      eventId: event.id,
      name: "م. فاطمة الزهراء",
      title: "مهندسة برمجيات أولى",
      bio: "قائدة فريق تطوير في شركة تقنية عالمية، متخصصة في الأنظمة الموزعة والحوسبة السحابية.",
      imageUrl: null,
      order: 1,
    },
  });
  console.log("✅ د. محمد الشريف");
  console.log("✅ م. فاطمة الزهراء\n");

  // ========== 10. الأجندة ==========
  console.log("📋 إنشاء الأجندة...");
  await prisma.agendaItem.createMany({
    data: [
      {
        eventId: event.id,
        time: "09:00 - 09:30",
        title: "الافتتاح والتسجيل",
        description: "استقبال المشاركين وتوزيع الشارات",
        order: 0,
      },
      {
        eventId: event.id,
        time: "09:30 - 10:30",
        title: "كلمة افتتاحية: مستقبل الذكاء الاصطناعي",
        description: "نظرة شاملة على آخر التطورات في مجال الذكاء الاصطناعي",
        speakerId: speaker1.id,
        order: 1,
      },
      {
        eventId: event.id,
        time: "10:45 - 12:00",
        title: "ورشة عمل: بناء تطبيقات ذكية",
        description: "ورشة تطبيقية باستخدام أحدث الأدوات",
        speakerId: speaker2.id,
        order: 2,
      },
      {
        eventId: event.id,
        time: "12:00 - 13:00",
        title: "استراحة الغداء",
        description: "غداء مفتوح وفرصة للتواصل",
        order: 3,
      },
      {
        eventId: event.id,
        time: "13:00 - 15:00",
        title: "جلسة نقاش: تحديات الأمن السيبراني",
        description: "حوار مفتوح حول أحدث تحديات الأمن الرقمي",
        speakerId: speaker1.id,
        order: 4,
      },
      {
        eventId: event.id,
        time: "15:15 - 17:00",
        title: "معرض الابتكارات",
        description: "استعراض أحدث المشاريع التقنية",
        order: 5,
      },
      {
        eventId: event.id,
        time: "17:00 - 18:00",
        title: "الحفل الختامي",
        description: "توزيع الجوائز وشهادات الحضور",
        order: 6,
      },
    ],
  });
  console.log("✅ 7 فقرات أجندة\n");

  // ========== 11. الأسئلة الشائعة ==========
  console.log("❓ إنشاء الأسئلة الشائعة...");
  await prisma.faq.createMany({
    data: [
      {
        eventId: event.id,
        question: "هل يمكنني الحضور بدون تسجيل مسبق؟",
        answer:
          "لا، يجب التسجيل مسبقاً عبر الموقع. سيتم إرسال رمز QR إلى بريدك الإلكتروني بعد الموافقة على التسجيل.",
        order: 0,
      },
      {
        eventId: event.id,
        question: "هل توجد مواقف سيارات؟",
        answer:
          "نعم، تتوفر مواقف سيارات مجانية تحت الأرض بسعة 500 سيارة. الدخول من البوابة الشرقية.",
        order: 1,
      },
      {
        eventId: event.id,
        question: "هل توجد ترجمة فورية؟",
        answer:
          "نعم، الجلسات الرئيسية ستحتوي على ترجمة فورية باللغتين العربية والإنجليزية.",
        order: 2,
      },
      {
        eventId: event.id,
        question: "ما هي سياسة الإلغاء؟",
        answer:
          "يمكنك إلغاء التسجيل قبل 48 ساعة من موعد الفعالية، مع إمكانية ترقية شخص آخر من قائمة الانتظار.",
        order: 3,
      },
    ],
  });
  console.log("✅ 4 أسئلة شائعة\n");

  // ========== 12. الشركاء ==========
  console.log("🤝 إنشاء الشركاء...");
  await prisma.sponsor.createMany({
    data: [
      {
        eventId: event.id,
        name: "TechCorp",
        logoUrl: null,
        websiteUrl: "https://example.com",
        tier: "platinum",
        order: 0,
      },
      {
        eventId: event.id,
        name: "InnovateHub",
        logoUrl: null,
        websiteUrl: "https://example.com",
        tier: "gold",
        order: 1,
      },
      {
        eventId: event.id,
        name: "CloudMasters",
        logoUrl: null,
        websiteUrl: "https://example.com",
        tier: "silver",
        order: 2,
      },
    ],
  });
  console.log("✅ 3 شركاء\n");

  // ========== 13. التسجيلات ==========
  console.log("📝 إنشاء التسجيلات...");

  const sampleAttendees = [
    {
      name: "خالد إبراهيم",
      email: "khaled@example.com",
      org: "جامعة القاهرة",
      job: "طالب",
    },
    {
      name: "نورهان سعيد",
      email: "nourhan@example.com",
      org: "شركة مايكروسوفت",
      job: "مهندسة",
    },
    { name: "عمر حسن", email: "omar@example.com", org: "IBM", job: "مطوّر" },
    {
      name: "ليلى محمود",
      email: "laila@example.com",
      org: "جامعة عين شمس",
      job: "طالبة",
    },
    {
      name: "يوسف أحمد",
      email: "youssef@example.com",
      org: "Google",
      job: "مهندس",
    },
    {
      name: "مريم علي",
      email: "mariam@example.com",
      org: "فريلانسر",
      job: "مصممة",
    },
    {
      name: "أحمد سامي",
      email: "ahmed.samy@example.com",
      org: "شركة ناشئة",
      job: "مؤسس",
    },
    {
      name: "سلمى ناصر",
      email: "salma@example.com",
      org: "بنك مصر",
      job: "محللة",
    },
    {
      name: "زياد وليد",
      email: "ziad@example.com",
      org: "Oracle",
      job: "استشاري",
    },
    {
      name: "هند فؤاد",
      email: "hind@example.com",
      org: "جامعة الإسكندرية",
      job: "باحثة",
    },
  ];

  const registrations: any[] = [];

  for (let i = 0; i < sampleAttendees.length; i++) {
    const a = sampleAttendees[i];
    const ticketTypes = [ticketStandard, ticketVip, ticketStudent];
    const ticketType = ticketTypes[i % 3];

    // توزيع الحالات
    let status: RegistrationStatus;
    if (i < 5) status = RegistrationStatus.APPROVED;
    else if (i < 7) status = RegistrationStatus.PENDING;
    else if (i < 8) status = RegistrationStatus.REJECTED;
    else status = RegistrationStatus.APPROVED;

    const reg = await prisma.registration.create({
      data: {
        eventId: event.id,
        fullName: a.name,
        email: a.email,
        phone: `+20 100${String(i).padStart(7, "0")}`,
        organization: a.org,
        jobTitle: a.job,
        ticketTypeId: ticketType.id,
        status,
        approvedAt: status === RegistrationStatus.APPROVED ? new Date() : null,
        rejectedAt: status === RegistrationStatus.REJECTED ? new Date() : null,
      },
    });
    registrations.push(reg);

    // توليد QR للمقبولين
    if (status === RegistrationStatus.APPROVED) {
      await prisma.checkInToken.create({
        data: {
          registrationId: reg.id,
          token: require("crypto").randomUUID(),
        },
      });
    }
  }
  console.log(`✅ 10 تسجيلات (5 مقبول، 2 معلق، 1 مرفوض، 2 مقبول)`);
  console.log(`✅ تم توليد رموز QR للمقبولين\n`);

  // ========== 14. تسجيلات دخول (Check-ins) ==========
  console.log("✅ إنشاء تسجيلات الدخول...");
  const approvedRegs = registrations.filter((r) => r.status === "APPROVED");

  // 3 تسجيلات دخول
  for (let i = 0; i < 3; i++) {
    const reg = approvedRegs[i];
    if (reg) {
      await prisma.checkIn.create({
        data: {
          registrationId: reg.id,
          method: CheckInMethod.QR_SCAN,
          checkedByUserId: staff.id,
          gateId: i % 2 === 0 ? gateMain.id : gateVip.id,
        },
      });
    }
  }
  console.log("✅ 3 تسجيلات دخول\n");

  // ========== 15. قائمة الانتظار ==========
  console.log("🕐 إنشاء قائمة الانتظار...");
  await prisma.waitlist.create({
    data: {
      eventId: event.id,
      fullName: "كريم عبد الله",
      email: "karim@example.com",
      phone: "+20 1009999999",
      organization: "جامعة حلوان",
      jobTitle: "طالب",
      status: "WAITING",
    },
  });
  console.log("✅ عنصر واحد في قائمة الانتظار\n");

  // ========== 16. الإشعارات ==========
  console.log("🔔 إنشاء الإشعارات...");
  await prisma.notification.createMany({
    data: [
      {
        userId: organizer.id,
        type: "registration",
        title: "تسجيل جديد",
        message: "تم تسجيل 5 مشاركين جدد في فعاليتك.",
        priority: "medium",
        relatedEntityType: "Event",
        relatedEntityId: event.id,
      },
      {
        userId: organizer.id,
        type: "reminder",
        title: "اقتراب موعد الفعالية",
        message: "متبقي 15 يوماً على موعد فعاليتك.",
        priority: "low",
        relatedEntityType: "Event",
        relatedEntityId: event.id,
      },
      {
        userId: staff.id,
        type: "staff_assignment",
        title: "تم تعيينك للفعالية",
        message: 'تم تعيينك كموظف تدقيق في فعالية "معرض التكنولوجيا 2026".',
        priority: "high",
        relatedEntityType: "Event",
        relatedEntityId: event.id,
      },
    ],
  });
  console.log("✅ 3 إشعارات\n");

  // ========== 17. سجل التدقيق ==========
  console.log("📋 إنشاء سجل التدقيق...");
  await prisma.auditLog.createMany({
    data: [
      {
        userId: organizer.id,
        action: "EVENT_CREATED",
        details: { eventId: event.id, title: event.title },
      },
      {
        userId: organizer.id,
        action: "EVENT_PUBLISHED",
        details: { eventId: event.id },
      },
      {
        userId: staff.id,
        action: "CHECKIN_QR_SUCCESS",
        details: { eventId: event.id, count: 3 },
      },
    ],
  });
  console.log("✅ 3 سجلات تدقيق\n");

  // ========== النهاية ==========
  console.log("═══════════════════════════════════════");
  console.log("🎉 اكتمل ملء قاعدة البيانات بنجاح!");
  console.log("═══════════════════════════════════════\n");
  console.log("📋 الحسابات التجريبية:");
  console.log("   👤 Admin:      admin@example.com / password123");
  console.log("   👤 Organizer:  organizer@example.com / password123");
  console.log("   👤 Staff:      staff@example.com / password123");
  console.log("\n🔗 رابط الفعالية العامة: /event/tech-expo-2026");
  console.log("═══════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ خطأ في ملء البيانات:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
