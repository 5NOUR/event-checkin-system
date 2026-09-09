import { z } from "zod";

// التحقق من صحة بيانات إنشاء الفعالية
export const createEventSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون على الأقل 3 أحرف"),
  description: z.string().min(10, "الوصف يجب أن يكون على الأقل 10 أحرف"),
  location: z.string().min(3, "الموقع مطلوب"),
  date: z
    .string()
    .datetime({ message: "التاريخ يجب أن يكون بصيغة صالحة (ISO 8601)" }),
  startTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "وقت البدء يجب أن يكون بصيغة HH:MM",
    ),
  endTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "وقت الانتهاء يجب أن يكون بصيغة HH:MM",
    ),
  capacity: z.number().int().positive("السعة يجب أن تكون عدداً صحيحاً موجباً"),
  registrationDeadline: z
    .string()
    .datetime({ message: "موعد التسجيل يجب أن يكون بصيغة صالحة" })
    .optional(),
  coverImageUrl: z.string().url("يجب أن تكون رابط صورة صالحاً").optional(),
});

// التحقق من صحة بيانات تحديث الفعالية (جميع الحقول اختيارية)
export const updateEventSchema = createEventSchema.partial();
