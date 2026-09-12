import { z } from "zod";

// UUID validator
export const uuidParamSchema = z.object({
  id: z.string().uuid("معرف غير صالح"),
});

export const eventIdParamSchema = z.object({
  eventId: z.string().uuid("معرف الفعالية غير صالح"),
});

export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/i, "صيغة الرابط غير صالحة"),
});

export const tokenParamSchema = z.object({
  token: z.string().min(10).max(200),
});

// Pagination query
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
