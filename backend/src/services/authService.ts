import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// ⏱️ مدة صلاحية الـ Access Token (قصير: 15 دقيقة)
const ACCESS_TOKEN_EXPIRY = "15m";
// ⏱️ مدة صلاحية الـ Refresh Token (طويل: 7 أيام)
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 أيام بالميلي ثانية

// دالة مساعدة: توليد Access Token
function generateAccessToken(
  userId: string,
  email: string,
  role: string,
): string {
  const secret = process.env.JWT_SECRET || "default-secret-change-this";
  return jwt.sign({ userId, email, role }, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

// دالة مساعدة: توليد Refresh Token عشوائي
function generateRefreshToken(): string {
  return randomUUID(); // UUID v4 عشوائي وآمن
}

// 1️⃣ تسجيل الدخول
export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string,
) {
  // البحث عن المستخدم
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      success: false,
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    };
  }

  // التحقق من نشاط الحساب
  if (!user.isActive) {
    return {
      success: false,
      error: "هذا الحساب غير نشط. يرجى التواصل مع المدير.",
    };
  }

  // التحقق من كلمة المرور
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return {
      success: false,
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    };
  }

  // إنشاء Access Token
  const accessToken = generateAccessToken(user.id, user.email, user.role);

  // إنشاء Refresh Token وتخزينه في قاعدة البيانات
  const refreshTokenString = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      expiresAt,
    },
  });

  // تسجيل نشاط الدخول في Audit Log (اختياري لكن مفيد)
  // await prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN', details: { ip: ipAddress, userAgent } } });

  // إزالة كلمة المرور من الكائن المُعاد
  const { passwordHash, ...userWithoutPassword } = user;

  return {
    success: true,
    data: {
      user: userWithoutPassword,
      accessToken, // سنرسله في الـ Cookie من الـ Controller
      refreshToken: refreshTokenString, // سنرسله في الـ Cookie أيضاً
    },
  };
}

// 2️⃣ تسجيل الخروج (إبطال Refresh Token)
export async function logout(refreshToken: string) {
  if (!refreshToken) {
    return { success: false, error: "لا يوجد جلسة نشطة." };
  }

  // تحديث التوكن بحالة "مُبطل" (revoked)
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revokedAt: new Date() },
  });

  return { success: true, message: "تم تسجيل الخروج بنجاح." };
}

// 3️⃣ تجديد Access Token باستخدام Refresh Token
export async function refreshAccessToken(refreshToken: string) {
  if (!refreshToken) {
    return { success: false, error: "Refresh token مطلوب." };
  }

  // البحث عن Refresh Token في قاعدة البيانات
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  // التحقق من وجوده وصلاحيته وعدم إبطاله
  if (!storedToken) {
    return { success: false, error: "Refresh token غير صالح." };
  }

  if (storedToken.revokedAt) {
    return { success: false, error: "Refresh token مُبطل." };
  }

  if (new Date() > storedToken.expiresAt) {
    return { success: false, error: "انتهت صلاحية Refresh token." };
  }

  // التحقق من أن المستخدم لا يزال نشطاً
  if (!storedToken.user.isActive) {
    return { success: false, error: "الحساب غير نشط." };
  }

  // توليد Access Token جديد
  const newAccessToken = generateAccessToken(
    storedToken.userId,
    storedToken.user.email,
    storedToken.user.role,
  );

  // (اختياري) تدوير Refresh Token: نُبطل القديم وننشئ جديداً لزيادة الأمان
  // في هذا الإصدار، نحتفظ بالقديم لتجنب تعقيد إدارة الجلسات المتعددة.
  // ولكن يمكننا تمديد صلاحيته إذا أردنا.

  return {
    success: true,
    data: {
      accessToken: newAccessToken,
    },
  };
}

// 4️⃣ إبطال جميع Refresh Tokens الخاصة بمستخدم (مثلاً عند تغيير كلمة المرور)
export async function revokeAllUserTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return { success: true };
}
// 5️⃣ تغيير كلمة المرور (للمستخدم المسجل)
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  // 1. جلب المستخدم من قاعدة البيانات
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: "المستخدم غير موجود." };
  }

  // 2. التحقق من كلمة المرور الحالية
  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    return { success: false, error: "كلمة المرور الحالية غير صحيحة." };
  }

  // 3. تشفير كلمة المرور الجديدة
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 4. تحديث كلمة المرور في قاعدة البيانات
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  // 5. 🔐 إبطال جميع Refresh Tokens الخاصة بالمستخدم (لأمان إضافي)
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return {
    success: true,
    message: "تم تغيير كلمة المرور بنجاح. سيتم تسجيل الخروج من جميع الأجهزة.",
  };
}
