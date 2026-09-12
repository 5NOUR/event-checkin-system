import request from "supertest";
import app from "../../src/app";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// إنشاء مستخدم اختباري
export async function createTestUser(data: {
  email: string;
  password: string;
  name?: string;
  role?: Role;
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name || "Test User",
      role: data.role || Role.ORGANIZER,
      isActive: true,
    },
  });
}

// تسجيل الدخول والحصول على التوكن
export async function loginAs(email: string, password: string) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  return {
    token: response.body.data?.accessToken,
    cookies: response.headers["set-cookie"],
    user: response.body.data?.user,
  };
}
