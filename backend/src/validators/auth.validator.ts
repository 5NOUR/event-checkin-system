import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .max(100),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z
    .string()
    .min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل")
    .max(100),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "الرمز غير صالح"),
  newPassword: z
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .max(100),
});
