import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

const prisma = new PrismaClient();

// دالة لتسجيل الدخول
export async function loginUser(email: string, password: string) {
  // 1. البحث عن المستخدم في قاعدة البيانات
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // 2. إذا لم يوجد المستخدم، نرفض الدخول
  if (!user) {
    return {
      success: false,
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    };
  }

  // 3. التحقق من أن الحساب نشط (isActive)
  if (!user.isActive) {
    return {
      success: false,
      error: "هذا الحساب غير نشط. يرجى التواصل مع المدير.",
    };
  }

  // 4. مقارنة كلمة المرور المدخلة مع المشفرة في قاعدة البيانات
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return {
      success: false,
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    };
  }

  // 5. إنشاء JWT (رمز المصادقة)
  const secret = process.env.JWT_SECRET || "default-secret-change-this";
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: "7d" }, // ينتهي بعد 7 أيام
  );

  // 6. إرجاع البيانات (نحذف passwordHash من الكائن قبل إرساله)
  const { passwordHash, ...userWithoutPassword } = user;

  return {
    success: true,
    data: {
      token,
      user: userWithoutPassword,
    },
  };
}
