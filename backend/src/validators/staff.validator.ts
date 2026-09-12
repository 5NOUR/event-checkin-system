import { z } from "zod";

export const addStaffSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  name: z.string().min(2, "الاسم مطلوب").max(200).optional(),
});
