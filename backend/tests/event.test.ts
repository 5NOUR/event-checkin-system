import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "./setup";
import { createTestUser } from "./helpers/auth.helper";
import { createTestEvent } from "./helpers/event.helper";
import { Role, EventStatus } from "@prisma/client";

describe("Event Management & Authorization", () => {
  let organizer: any;
  let organizerCookies: string[];
  let otherOrganizer: any;
  let otherOrganizerCookies: string[];
  let staffUser: any;
  let staffCookies: string[];

  beforeEach(async () => {
    // إنشاء منظم رئيسي
    organizer = await createTestUser({
      email: "organizer-events@example.com",
      password: "testPassword123",
      name: "Main Organizer",
      role: Role.ORGANIZER,
    });
    const login1 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: organizer.email, password: "testPassword123" });
    organizerCookies = login1.headers["set-cookie"] as unknown as string[];

    // إنشاء منظم آخر (للاختبارات IDOR)
    otherOrganizer = await createTestUser({
      email: "other-organizer@example.com",
      password: "testPassword123",
      name: "Other Organizer",
      role: Role.ORGANIZER,
    });
    const login2 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: otherOrganizer.email, password: "testPassword123" });
    otherOrganizerCookies = login2.headers["set-cookie"] as unknown as string[];

    // إنشاء موظف
    staffUser = await createTestUser({
      email: "staff-events@example.com",
      password: "testPassword123",
      name: "Test Staff",
      role: Role.STAFF,
    });
    const login3 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: staffUser.email, password: "testPassword123" });
    staffCookies = login3.headers["set-cookie"] as unknown as string[];
  });

  // ========== 1. CREATE EVENT ==========
  describe("POST /api/v1/events", () => {
    const validEventPayload = {
      title: "Tech Conference 2026",
      description: "Annual technology conference with the best speakers.",
      location: "Cairo, Egypt",
      date: new Date("2026-12-15").toISOString(),
      startTime: "09:00",
      endTime: "18:00",
      capacity: 500,
    };

    it("✅ should create event successfully as organizer", async () => {
      const response = await request(app)
        .post("/api/v1/events")
        .set("Cookie", organizerCookies)
        .send(validEventPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(validEventPayload.title);
      expect(response.body.data.status).toBe("DRAFT");
      expect(response.body.data.organizerId).toBe(organizer.id);

      // ✅ التحقق من تسجيل Audit Log
      const auditLog = await prisma.auditLog.findFirst({
        where: { userId: organizer.id, action: "EVENT_CREATED" },
      });
      expect(auditLog).toBeDefined();
    });

    it("❌ should fail without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/events")
        .send(validEventPayload);

      expect(response.status).toBe(401);
    });

    it("❌ should deny STAFF from creating events", async () => {
      const response = await request(app)
        .post("/api/v1/events")
        .set("Cookie", staffCookies)
        .send(validEventPayload);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("❌ should fail with invalid data (missing title)", async () => {
      const response = await request(app)
        .post("/api/v1/events")
        .set("Cookie", organizerCookies)
        .send({ ...validEventPayload, title: "AB" }); // أقل من 3 أحرف

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("❌ should fail with capacity <= 0", async () => {
      const response = await request(app)
        .post("/api/v1/events")
        .set("Cookie", organizerCookies)
        .send({ ...validEventPayload, capacity: 0 });

      expect(response.status).toBe(400);
    });

    it("❌ should fail with invalid date format", async () => {
      const response = await request(app)
        .post("/api/v1/events")
        .set("Cookie", organizerCookies)
        .send({ ...validEventPayload, date: "not-a-date" });

      expect(response.status).toBe(400);
    });
  });

  // ========== 2. GET ORGANIZER'S EVENTS ==========
  describe("GET /api/v1/events", () => {
    beforeEach(async () => {
      // إنشاء فعاليتين للمنظم الرئيسي
      await createTestEvent(organizer.id, {
        title: "Event 1",
        slug: "event-1",
      });
      await createTestEvent(organizer.id, {
        title: "Event 2",
        slug: "event-2",
      });

      // إنشاء فعالية لمنظم آخر (يجب ألا تظهر)
      await createTestEvent(otherOrganizer.id, {
        title: "Other Event",
        slug: "other-event",
      });
    });

    it("✅ should return only organizer's events", async () => {
      const response = await request(app)
        .get("/api/v1/events")
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // ✅ التحقق من أن جميع الفعاليات ملك للمنظم
      const allOwnedByOrganizer = response.body.data.every(
        (event: any) => event.organizerId === organizer.id,
      );
      expect(allOwnedByOrganizer).toBe(true);
    });

    it("❌ should deny access to STAFF", async () => {
      const response = await request(app)
        .get("/api/v1/events")
        .set("Cookie", staffCookies);

      expect(response.status).toBe(403);
    });
  });

  // ========== 3. IDOR - GET SPECIFIC EVENT ==========
  describe("GET /api/v1/events/:id (IDOR protection)", () => {
    let organizerEvent: any;
    let otherEvent: any;

    beforeEach(async () => {
      organizerEvent = await createTestEvent(organizer.id, {
        title: "My Event",
        slug: "my-event",
      });
      otherEvent = await createTestEvent(otherOrganizer.id, {
        title: "Other Event",
        slug: "other-event",
      });
    });

    it("✅ should allow organizer to view own event", async () => {
      const response = await request(app)
        .get(`/api/v1/events/${organizerEvent.id}`)
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(organizerEvent.id);
    });

    it("❌ should DENY organizer from viewing another organizer's event (IDOR)", async () => {
      const response = await request(app)
        .get(`/api/v1/events/${otherEvent.id}`)
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("❌ should return 404 for non-existent event", async () => {
      const response = await request(app)
        .get("/api/v1/events/00000000-0000-0000-0000-000000000000")
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(404);
    });

    it("❌ should fail with invalid UUID format", async () => {
      const response = await request(app)
        .get("/api/v1/events/not-a-uuid")
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ========== 4. UPDATE EVENT (IDOR) ==========
  describe("PATCH /api/v1/events/:id (IDOR protection)", () => {
    let organizerEvent: any;
    let otherEvent: any;

    beforeEach(async () => {
      organizerEvent = await createTestEvent(organizer.id, {
        slug: "my-update-event",
      });
      otherEvent = await createTestEvent(otherOrganizer.id, {
        slug: "other-update-event",
      });
    });

    it("✅ should allow organizer to update own event", async () => {
      const response = await request(app)
        .patch(`/api/v1/events/${organizerEvent.id}`)
        .set("Cookie", organizerCookies)
        .send({ title: "Updated Title" });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Updated Title");
    });

    it("❌ should DENY organizer from updating another's event (IDOR)", async () => {
      const response = await request(app)
        .patch(`/api/v1/events/${otherEvent.id}`)
        .set("Cookie", organizerCookies)
        .send({ title: "Hacked Title" });

      expect(response.status).toBe(403);
    });
  });

  // ========== 5. EVENT STATUS TRANSITIONS ==========
  describe("PATCH /api/v1/events/:id/status", () => {
    let testEvent: any;

    beforeEach(async () => {
      testEvent = await createTestEvent(organizer.id, {
        status: EventStatus.DRAFT,
        slug: "status-test-event",
      });
    });

    it("✅ should allow DRAFT → PUBLISHED", async () => {
      const response = await request(app)
        .patch(`/api/v1/events/${testEvent.id}/status`)
        .set("Cookie", organizerCookies)
        .send({ status: "PUBLISHED" });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("PUBLISHED");

      // ✅ التحقق من Audit Log
      const auditLog = await prisma.auditLog.findFirst({
        where: { userId: organizer.id, action: "EVENT_PUBLISHED" },
      });
      expect(auditLog).toBeDefined();
    });

    it("✅ should allow PUBLISHED → ONGOING", async () => {
      await prisma.event.update({
        where: { id: testEvent.id },
        data: { status: EventStatus.PUBLISHED },
      });

      const response = await request(app)
        .patch(`/api/v1/events/${testEvent.id}/status`)
        .set("Cookie", organizerCookies)
        .send({ status: "ONGOING" });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("ONGOING");
    });

    it("❌ should reject invalid status value", async () => {
      const response = await request(app)
        .patch(`/api/v1/events/${testEvent.id}/status`)
        .set("Cookie", organizerCookies)
        .send({ status: "INVALID_STATUS" });

      expect(response.status).toBe(400);
    });

    it("❌ should DENY organizer from changing another's event status", async () => {
      const response = await request(app)
        .patch(`/api/v1/events/${testEvent.id}/status`)
        .set("Cookie", otherOrganizerCookies)
        .send({ status: "PUBLISHED" });

      expect(response.status).toBe(403);
    });
  });

  // ========== 6. STAFF MANAGEMENT ==========
  describe("Staff Management", () => {
    let testEvent: any;

    beforeEach(async () => {
      testEvent = await createTestEvent(organizer.id, {
        slug: "staff-test-event",
      });
    });

    it("✅ should add staff to event", async () => {
      const response = await request(app)
        .post(`/api/v1/staff/event/${testEvent.id}`)
        .set("Cookie", organizerCookies)
        .send({ email: staffUser.email, name: staffUser.name });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staffId).toBe(staffUser.id);

      // ✅ التحقق من Audit Log
      const auditLog = await prisma.auditLog.findFirst({
        where: { userId: organizer.id, action: "STAFF_ASSIGNED" },
      });
      expect(auditLog).toBeDefined();
    });

    it("❌ should fail to add staff to another organizer's event", async () => {
      const response = await request(app)
        .post(`/api/v1/staff/event/${testEvent.id}`)
        .set("Cookie", otherOrganizerCookies)
        .send({ email: "newstaff@example.com" });

      expect(response.status).toBe(403);
    });

    it("✅ should get event staff list", async () => {
      await prisma.eventStaff.create({
        data: {
          eventId: testEvent.id,
          staffId: staffUser.id,
          isActive: true,
        },
      });

      const response = await request(app)
        .get(`/api/v1/staff/event/${testEvent.id}`)
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].staff.email).toBe(staffUser.email);
    });

    it("✅ should remove staff from event", async () => {
      await prisma.eventStaff.create({
        data: {
          eventId: testEvent.id,
          staffId: staffUser.id,
          isActive: true,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/staff/event/${testEvent.id}/staff/${staffUser.id}`)
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(200);

      // ✅ التحقق من Audit Log
      const auditLog = await prisma.auditLog.findFirst({
        where: { userId: organizer.id, action: "STAFF_REMOVED" },
      });
      expect(auditLog).toBeDefined();

      // ✅ التحقق من أن التعيين أصبح غير نشط
      const assignment = await prisma.eventStaff.findUnique({
        where: {
          eventId_staffId: {
            eventId: testEvent.id,
            staffId: staffUser.id,
          },
        },
      });
      expect(assignment?.isActive).toBe(false);
    });

    it("✅ should reactivate staff", async () => {
      await prisma.eventStaff.create({
        data: {
          eventId: testEvent.id,
          staffId: staffUser.id,
          isActive: false,
        },
      });

      const response = await request(app)
        .patch(
          `/api/v1/staff/event/${testEvent.id}/staff/${staffUser.id}/reactivate`,
        )
        .set("Cookie", organizerCookies);

      expect(response.status).toBe(200);

      const assignment = await prisma.eventStaff.findUnique({
        where: {
          eventId_staffId: {
            eventId: testEvent.id,
            staffId: staffUser.id,
          },
        },
      });
      expect(assignment?.isActive).toBe(true);
    });
  });

  // ========== 7. DELETE / CASCADE ==========
  describe("Event Relationships", () => {
    it("✅ should cascade delete related data when event is deleted", async () => {
      const testEvent = await createTestEvent(organizer.id, {
        slug: "cascade-test-event",
      });

      // إضافة بيانات مرتبطة
      await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          fullName: "Test Attendee",
          email: "attendee@example.com",
          status: "PENDING",
        },
      });
      await prisma.faq.create({
        data: {
          eventId: testEvent.id,
          question: "Test Q?",
          answer: "Test A.",
        },
      });

      // حذف الفعالية
      await prisma.event.delete({ where: { id: testEvent.id } });

      // ✅ التحقق من أن البيانات المرتبطة حُذفت
      const regs = await prisma.registration.findMany({
        where: { eventId: testEvent.id },
      });
      expect(regs).toHaveLength(0);

      const faqs = await prisma.faq.findMany({
        where: { eventId: testEvent.id },
      });
      expect(faqs).toHaveLength(0);
    });
  });
});
