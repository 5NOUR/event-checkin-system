import { z } from "zod";

// المتحدثون
export const createSpeakerSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب").max(200),
  title: z.string().max(300).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export const updateSpeakerSchema = createSpeakerSchema.partial();

// الأجندة
export const createAgendaSchema = z.object({
  time: z.string().min(1, "الوقت مطلوب").max(100),
  title: z.string().min(2, "العنوان مطلوب").max(300),
  description: z.string().max(2000).optional().nullable(),
  speakerId: z.string().uuid().optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export const updateAgendaSchema = createAgendaSchema.partial();

// الأسئلة الشائعة
export const createFaqSchema = z.object({
  question: z.string().min(5, "السؤال مطلوب").max(500),
  answer: z.string().min(5, "الإجابة مطلوبة").max(3000),
  order: z.number().int().min(0).optional(),
});

export const updateFaqSchema = createFaqSchema.partial();

// الشركاء
export const createSponsorSchema = z.object({
  name: z.string().min(2, "اسم الشريك مطلوب").max(200),
  logoUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  tier: z
    .enum(["platinum", "gold", "silver", "bronze", "partner"])
    .optional()
    .nullable(),
  order: z.number().int().min(0).optional(),
});

export const updateSponsorSchema = createSponsorSchema.partial();

// معرض الصور
export const createGalleryImageSchema = z.object({
  imageUrl: z.string().url("رابط الصورة غير صالح"),
  caption: z.string().max(300).optional().nullable(),
  order: z.number().int().min(0).optional(),
});

// البوابات
export const createGateSchema = z.object({
  name: z.string().min(2, "اسم البوابة مطلوب").max(200),
  location: z.string().max(300).optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export const updateGateSchema = createGateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// أنواع التذاكر
export const createTicketTypeSchema = z.object({
  name: z.string().min(2, "اسم النوع مطلوب").max(100),
  description: z.string().max(1000).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "اللون يجب أن يكون hex مثل #B08D57")
    .optional()
    .nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export const updateTicketTypeSchema = createTicketTypeSchema.partial().extend({
  isActive: z.boolean().optional(),
});
