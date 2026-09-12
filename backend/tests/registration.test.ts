import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "./setup";
import { createTestUser } from "./helpers/auth.helper";
import { createTestEvent } from "./helpers/event.helper";
import { Role, EventStatus, RegistrationStatus } from "@prisma/client";

describe("Registration & Check-in Endpoints", () => {
  let organizer: any;
  let organizerCookies: string[];
  let testEvent: any;

  beforeEach(async () => {
    // إنشاء منظم
    organizer = await createTestUser({
      email: "organizer-reg@example.com",
      password: "testPassword123",
      name: "Test Organizer",
      role: Role.ORGANIZER,
    });

    // تسجيل دخول المنظم
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: organizer.email,
      password: "testPassword123",
    });
    organizerCookies = loginRes.headers["set-cookie"] as unknown as string[];

    // إنشاء فعالية اختبارية
    testEvent = await createTestEvent(organizer.id, {
      capacity: 5,
      status: EventStatus.PUBLISHED,
      slug: `test-event-${Date.now()}`,
    });
  });

  // ========== 1. PUBLIC REGISTRATION ==========
  describe("POST /api/v1/registrations (Public)", () => {
    it("✅ should register attendee successfully", async () => {
      const response = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "أحمد محمد",
        email: "ahmed@example.com",
        phone: "01012345678",
        organization: "جامعة القاهرة",
        jobTitle: "طالب",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe("PENDING");
      expect(response.body.waitlisted).toBe(false);
    });

    it("❌ should fail with duplicate email for same event", async () => {
      // التسجيل الأول
      await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "أحمد محمد",
        email: "ahmed@example.com",
      });

      // محاولة التسجيل مرة أخرى بنفس البريد
      const response = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "أحمد محمد",
        email: "ahmed@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain("مسجل بالفعل");
    });

    it("❌ should fail with missing required fields", async () => {
      const response = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        // بدون fullName و email
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("❌ should fail with invalid email", async () => {
      const response = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "أحمد محمد",
        email: "not-an-email",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("❌ should fail with non-existent event slug", async () => {
      const response = await request(app).post("/api/v1/registrations").send({
        eventSlug: "non-existent-event-slug",
        fullName: "أحمد محمد",
        email: "ahmed@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("❌ should fail for cancelled event", async () => {
      await prisma.event.update({
        where: { id: testEvent.id },
        data: { status: EventStatus.CANCELLED },
      });

      const response = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "أحمد محمد",
        email: "ahmed@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ========== 2. CAPACITY & WAITLIST ==========
  describe("Capacity & Waitlist", () => {
    it("✅ should add to waitlist when capacity is full", async () => {
      // ملء السعة (5)
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post("/api/v1/registrations")
          .send({
            eventSlug: testEvent.slug,
            fullName: `Attendee ${i}`,
            email: `attendee${i}@example.com`,
          });
      }

      // محاولة التسجيل السادس
      const response = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "Attendee 6",
        email: "attendee6@example.com",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.waitlisted).toBe(true);
      expect(response.body.message).toContain("قائمة الانتظار");

      // ✅ التحقق من تخزينه في Waitlist
      const waitlistEntry = await prisma.waitlist.findFirst({
        where: {
          email: "attendee6@example.com",
          eventId: testEvent.id,
        },
      });
      expect(waitlistEntry).toBeDefined();
      expect(waitlistEntry?.status).toBe("WAITING");
    });

    it("❌ should prevent duplicate waitlist entry", async () => {
      // ملء السعة
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post("/api/v1/registrations")
          .send({
            eventSlug: testEvent.slug,
            fullName: `Attendee ${i}`,
            email: `attendee${i}@example.com`,
          });
      }

      // إضافة إلى قائمة الانتظار
      await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "Waitlist Person",
        email: "waitlist@example.com",
      });

      // محاولة إضافته مرة أخرى
      const response = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "Waitlist Person",
        email: "waitlist@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain("بالفعل في قائمة الانتظار");
    });
  });

  // ========== 3. GET REGISTRATIONS (PROTECTED) ==========
  describe("GET /api/v1/registrations/event/:eventId", () => {
    it("✅ should return registrations for the organizer", async () => {
      // تسجيل حضور
      await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "Attendee 1",
        email: "attendee1@example.com",
      });

      const response = await request(app)
        .get(`/api/v1/registrations/event/${testEvent.id}`)
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it("❌ should fail without authentication", async () => {
      const response = await request(app).get(
        `/api/v1/registrations/event/${testEvent.id}`,
      );

      expect(response.status).toBe(401);
    });

    it("❌ should deny access to another organizer", async () => {
      // منظم آخر
      const otherOrganizer = await createTestUser({
        email: "other@example.com",
        password: "testPassword123",
        role: Role.ORGANIZER,
      });

      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: otherOrganizer.email,
        password: "testPassword123",
      });

      const response = await request(app)
        .get(`/api/v1/registrations/event/${testEvent.id}`)
        .set("Cookie", loginRes.headers["set-cookie"]);

      expect(response.status).toBe(403);
    });
  });

  // ========== 4. APPROVE / REJECT ==========
  describe("Approve / Reject Registration", () => {
    let registration: any;

    beforeEach(async () => {
      const res = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "Attendee 1",
        email: "attendee1@example.com",
      });
      registration = res.body.data;
    });

    it("✅ should approve registration and generate QR token", async () => {
      const response = await request(app)
        .post(`/api/v1/registrations/${registration.id}/approve`)
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // ✅ التحقق من حالة التسجيل
      const updated = await prisma.registration.findUnique({
        where: { id: registration.id },
      });
      expect(updated?.status).toBe("APPROVED");

      // ✅ التحقق من توليد QR Token
      const token = await prisma.checkInToken.findUnique({
        where: { registrationId: registration.id },
      });
      expect(token).toBeDefined();
      expect(token?.token).toBeDefined();
    });

    it("✅ should reject registration", async () => {
      const response = await request(app)
        .post(`/api/v1/registrations/${registration.id}/reject`)
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updated = await prisma.registration.findUnique({
        where: { id: registration.id },
      });
      expect(updated?.status).toBe("REJECTED");
    });

    it("❌ should fail to approve already processed registration", async () => {
      await request(app)
        .post(`/api/v1/registrations/${registration.id}/approve`)
        .set("Cookie", organizerCookies);

      const response = await request(app)
        .post(`/api/v1/registrations/${registration.id}/approve`)
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(400);
    });
  });

  // ========== 5. QR VALIDATION (Public) ==========
  describe("GET /api/v1/registrations/qr/:token", () => {
    let validToken: string;

    beforeEach(async () => {
      // تسجيل + موافقة
      const regRes = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "Attendee 1",
        email: "attendee1@example.com",
      });

      await request(app)
        .post(`/api/v1/registrations/${regRes.body.data.id}/approve`)
        .set("Cookie", organizerCookies);

      const tokenRecord = await prisma.checkInToken.findUnique({
        where: { registrationId: regRes.body.data.id },
      });
      validToken = tokenRecord!.token;
    });

    it("✅ should return QR data for valid token (public)", async () => {
      const response = await request(app).get(
        `/api/v1/registrations/qr/${validToken}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe("Attendee 1");
    });

    it("❌ should return 404 for invalid token", async () => {
      const response = await request(app).get(
        `/api/v1/registrations/qr/invalid-token-12345`,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ========== 6. CHECK-IN ==========
  describe("POST /api/v1/checkin/verify", () => {
    let staffUser: any;
    let staffCookies: string[];
    let validToken: string;
    let registrationId: string;

    beforeEach(async () => {
      // إنشاء موظف
      staffUser = await createTestUser({
        email: "staff-checkin@example.com",
        password: "testPassword123",
        name: "Test Staff",
        role: Role.STAFF,
      });

      // ربط الموظف بالفعالية
      await prisma.eventStaff.create({
        data: {
          eventId: testEvent.id,
          staffId: staffUser.id,
          isActive: true,
        },
      });

      // تسجيل دخول الموظف
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: staffUser.email,
        password: "testPassword123",
      });
      staffCookies = loginRes.headers["set-cookie"] as unknown as string[];

      // تسجيل حضور + موافقة
      const regRes = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "Attendee Check-in",
        email: "checkin@example.com",
      });
      registrationId = regRes.body.data.id;

      await request(app)
        .post(`/api/v1/registrations/${registrationId}/approve`)
        .set("Cookie", organizerCookies);

      const tokenRecord = await prisma.checkInToken.findUnique({
        where: { registrationId },
      });
      validToken = tokenRecord!.token;
    });

    it("✅ should check-in successfully with valid QR", async () => {
      const response = await request(app)
        .post("/api/v1/checkin/verify")
        .set("Cookie", staffCookies)
        .send({
          token: validToken,
          eventId: testEvent.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.attendeeName).toBe("Attendee Check-in");

      // ✅ التحقق من إنشاء CheckIn record
      const checkIn = await prisma.checkIn.findUnique({
        where: { registrationId },
      });
      expect(checkIn).toBeDefined();
      expect(checkIn?.method).toBe("QR_SCAN");
    });

    it("❌ should reject duplicate check-in", async () => {
      // Check-in الأول
      await request(app)
        .post("/api/v1/checkin/verify")
        .set("Cookie", staffCookies)
        .send({
          token: validToken,
          eventId: testEvent.id,
        });

      // محاولة Check-in مرة أخرى
      const response = await request(app)
        .post("/api/v1/checkin/verify")
        .set("Cookie", staffCookies)
        .send({
          token: validToken,
          eventId: testEvent.id,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("ALREADY_CHECKED_IN");
    });

    it("❌ should reject QR from another event", async () => {
      // إنشاء فعالية أخرى
      const otherEvent = await createTestEvent(organizer.id, {
        slug: `other-event-${Date.now()}`,
        status: EventStatus.PUBLISHED,
      });

      const response = await request(app)
        .post("/api/v1/checkin/verify")
        .set("Cookie", staffCookies)
        .send({
          token: validToken,
          eventId: otherEvent.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("WRONG_EVENT");
    });

    it("❌ should reject QR for non-approved registration", async () => {
      // تسجيل بدون موافقة
      const regRes = await request(app).post("/api/v1/registrations").send({
        eventSlug: testEvent.slug,
        fullName: "Not Approved",
        email: "notapproved@example.com",
      });

      // محاولة استخدام token (لن يكون موجوداً)
      const tokenRecord = await prisma.checkInToken.findUnique({
        where: { registrationId: regRes.body.data.id },
      });
      expect(tokenRecord).toBeNull();

      // ملاحظة: بدون موافقة، لا يوجد token للاختبار
      // هذا الاختبار يتحقق من عدم توليد token للتسجيل المعلق
    });

    it("❌ should fail without authentication", async () => {
      const response = await request(app).post("/api/v1/checkin/verify").send({
        token: validToken,
        eventId: testEvent.id,
      });

      expect(response.status).toBe(401);
    });

    it("❌ should reject invalid token", async () => {
      const response = await request(app)
        .post("/api/v1/checkin/verify")
        .set("Cookie", staffCookies)
        .send({
          token: "invalid-token-12345678",
          eventId: testEvent.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
