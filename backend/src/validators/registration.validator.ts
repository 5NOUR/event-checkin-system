import { z } from "zod";

export const createRegistrationSchema = z.object({
  eventSlug: z.string().min(1, "رابط الفعالية مطلوب"),
  fullName: z.string().min(3, "الاسم الكامل مطلوب (على الأقل 3 أحرف)"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().optional(),
  organization: z.string().optional(),
  jobTitle: z.string().optional(),
});
