import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "./setup";
import { createTestUser } from "./helpers/auth.helper";
import { Role } from "@prisma/client";

describe("Authentication Endpoints", () => {
  const validUser = {
    email: "auth-test@example.com",
    password: "testPassword123",
    name: "Test Organizer",
    role: Role.ORGANIZER,
  };

  beforeEach(async () => {
    // إنشاء مستخدم نظيف لكل اختبار
    await createTestUser(validUser);
  });

  // ========== 1. LOGIN SUCCESS ==========
  describe("POST /api/v1/auth/login", () => {
    it("✅ should login successfully with valid credentials", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: validUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.user.role).toBe(validUser.role);
      // لا يجب أن يعيد passwordHash
      expect(response.body.data.user.passwordHash).toBeUndefined();

      // ✅ التحقق من الـ Cookies
      const cookies = response.headers["set-cookie"] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith("accessToken="))).toBe(true);
      expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
    });

    it("❌ should fail with invalid password", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: "wrongPassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("❌ should fail with non-existent email", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "doesnotexist@example.com",
        password: validUser.password,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("❌ should fail with missing fields", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: validUser.email });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("❌ should fail with invalid email format", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "not-an-email",
        password: validUser.password,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("❌ should fail for disabled accounts", async () => {
      // تعطيل المستخدم
      await prisma.user.update({
        where: { email: validUser.email },
        data: { isActive: false },
      });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: validUser.password,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ========== 2. GET /me (Protected) ==========
  describe("GET /api/v1/auth/me", () => {
    it("❌ should fail without token", async () => {
      const response = await request(app).get("/api/v1/auth/me");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("✅ should return current user with valid token", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: validUser.password,
      });

      const cookies = loginRes.headers["set-cookie"];

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(validUser.email);
    });
  });

  // ========== 3. LOGOUT ==========
  describe("POST /api/v1/auth/logout", () => {
    it("✅ should logout successfully", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: validUser.password,
      });

      const cookies = loginRes.headers["set-cookie"];

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // ✅ التحقق من مسح الـ Cookies
      const clearedCookies = response.headers[
        "set-cookie"
      ] as unknown as string[];
      expect(clearedCookies.some((c) => c.includes("accessToken="))).toBe(true);
      expect(clearedCookies.some((c) => c.includes("refreshToken="))).toBe(
        true,
      );
    });
  });

  // ========== 4. CHANGE PASSWORD ==========
  describe("POST /api/v1/auth/change-password", () => {
    it("✅ should change password successfully", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: validUser.password,
      });

      const cookies = loginRes.headers["set-cookie"];

      const response = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Cookie", cookies)
        .send({
          currentPassword: validUser.password,
          newPassword: "newPassword456",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // ✅ التحقق من أن كلمة المرور الجديدة تعمل
      const newLoginRes = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: "newPassword456",
      });

      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.success).toBe(true);
    });

    it("❌ should fail with wrong current password", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: validUser.password,
      });

      const cookies = loginRes.headers["set-cookie"];

      const response = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Cookie", cookies)
        .send({
          currentPassword: "wrongPassword",
          newPassword: "newPassword456",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("❌ should fail with weak new password", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: validUser.password,
      });

      const cookies = loginRes.headers["set-cookie"];

      const response = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Cookie", cookies)
        .send({
          currentPassword: validUser.password,
          newPassword: "123", // أقل من 6 أحرف
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ========== 5. FORGOT PASSWORD ==========
  describe("POST /api/v1/auth/forgot-password", () => {
    it("✅ should return success even for non-existent email (security)", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "doesnotexist@example.com" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("✅ should accept valid email and set reset token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: validUser.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // ✅ التحقق من أن الرمز تم تخزينه
      const user = await prisma.user.findUnique({
        where: { email: validUser.email },
      });
      expect(user?.passwordResetToken).toBeDefined();
      expect(user?.passwordResetToken).not.toBeNull();
    });
  });

  // ========== 6. RESET PASSWORD ==========
  describe("POST /api/v1/auth/reset-password", () => {
    it("✅ should reset password with valid token", async () => {
      // 1. طلب إعادة التعيين
      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: validUser.email });

      // 2. جلب الرمز من قاعدة البيانات
      const user = await prisma.user.findUnique({
        where: { email: validUser.email },
      });
      const token = user!.passwordResetToken!;

      // 3. إعادة تعيين كلمة المرور
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token,
          newPassword: "brandNewPassword789",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // 4. التحقق من أن كلمة المرور الجديدة تعمل
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: "brandNewPassword789",
      });

      expect(loginRes.status).toBe(200);
    });

    it("❌ should fail with invalid token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: "invalid-token-12345",
          newPassword: "newPassword456",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ========== 7. REFRESH TOKEN ==========
  describe("POST /api/v1/auth/refresh", () => {
    it("✅ should refresh access token with valid refresh token", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: validUser.password,
      });

      const cookies = loginRes.headers["set-cookie"];

      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("❌ should fail without refresh token", async () => {
      const response = await request(app).post("/api/v1/auth/refresh");
      expect(response.status).toBe(401);
    });
  });

  // ========== 8. RBAC ==========
  describe("RBAC - Role-Based Access Control", () => {
    it("✅ should allow organizer to access organizer routes", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: validUser.email,
        password: validUser.password,
      });

      const cookies = loginRes.headers["set-cookie"];

      const response = await request(app)
        .get("/api/v1/events")
        .set("Cookie", cookies);

      // المنظم يجب أن يرى قائمة فعالياته (فارغة في هذه الحالة)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("❌ should deny staff access to organizer routes", async () => {
      // إنشاء مستخدم STAFF
      const staffUser = {
        email: "staff-test@example.com",
        password: "testPassword123",
        name: "Test Staff",
        role: Role.STAFF,
      };
      await createTestUser(staffUser);

      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: staffUser.email,
        password: staffUser.password,
      });

      const cookies = loginRes.headers["set-cookie"];

      // الموظف يحاول الوصول إلى مسار المنظم
      const response = await request(app)
        .get("/api/v1/events")
        .set("Cookie", cookies);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
