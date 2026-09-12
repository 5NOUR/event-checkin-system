import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { passwordResetEmail, sendEmail } from "./emailService";

const prisma = new PrismaClient();

// توليد رمز عشوائي آمن
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// 1️⃣ طلب إعادة تعيين كلمة المرور
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // ✅ نرجع نجاح وهمي حتى لا نكشف وجود المستخدم (أمان)
    return {
      success: true,
      message: "إذا كان هذا البريد مسجلاً، ستتلقى رابط إعادة التعيين.",
    };
  }

  // توليد رمز مميز
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة

  // تخزين الرمز في قاعدة البيانات
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
    },
  });
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "إعادة تعيين كلمة المرور",
      html: passwordResetEmail({
        userName: user.name || "المستخدم",
        resetUrl,
      }),
    });
  } catch (err) {
    console.error("فشل إرسال بريد إعادة التعيين:", err);
  }

  // 📧 محاكاة إرسال البريد الإلكتروني (تسجيل الرابط في وحدة التحكم)
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;
  console.log(`🔑 رابط إعادة تعيين كلمة المرور: ${resetLink}`);

  return {
    success: true,
    message: "إذا كان هذا البريد مسجلاً، ستتلقى رابط إعادة التعيين.",
  };
}

// 2️⃣ إعادة تعيين كلمة المرور باستخدام الرمز
export async function resetPassword(token: string, newPassword: string) {
  // البحث عن المستخدم بالرمز المميز
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date(), // لم تنته صلاحيته
      },
    },
  });

  if (!user) {
    return {
      success: false,
      error: "الرمز غير صالح أو منتهي الصلاحية.",
    };
  }

  // تشفير كلمة المرور الجديدة
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // تحديث المستخدم وإزالة الرمز
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // 🔐 إبطال جميع Refresh Tokens الخاصة بالمستخدم (لأمان إضافي)
  await prisma.refreshToken.updateMany({
    where: { userId: user.id },
    data: { revokedAt: new Date() },
  });

  return {
    success: true,
    message: "تم إعادة تعيين كلمة المرور بنجاح.",
  };
}
