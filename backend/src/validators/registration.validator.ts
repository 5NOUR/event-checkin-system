import { z } from "zod";

export const createRegistrationSchema = z.object({
  eventSlug: z.string().min(1, "رابط الفعالية مطلوب").max(200),
  fullName: z.string().min(3, "الاسم الكامل مطلوب (3 أحرف على الأقل)").max(200),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().max(30).optional().nullable(),
  organization: z.string().max(200).optional().nullable(),
  jobTitle: z.string().max(200).optional().nullable(),
  ticketTypeId: z.string().uuid().optional().nullable(),
});
