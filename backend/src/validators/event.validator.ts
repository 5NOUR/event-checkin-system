import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل").max(200),
  description: z
    .string()
    .min(10, "الوصف يجب أن يكون 10 أحرف على الأقل")
    .max(5000),
  location: z.string().min(3, "الموقع مطلوب").max(300),
  date: z.string().datetime({ message: "التاريخ غير صالح" }),
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "وقت البدء غير صالح (HH:MM)"),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "وقت الانتهاء غير صالح (HH:MM)"),
  capacity: z
    .number()
    .int()
    .positive("السعة يجب أن تكون أكبر من 0")
    .max(1000000),
  registrationDeadline: z.string().datetime().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
});

export const updateEventSchema = createEventSchema.partial();

export const updateEventStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "PUBLISHED",
    "REGISTRATION_CLOSED",
    "ONGOING",
    "COMPLETED",
    "CANCELLED",
  ]),
});
