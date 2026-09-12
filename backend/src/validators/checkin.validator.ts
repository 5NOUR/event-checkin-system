import { z } from "zod";

export const verifyCheckInSchema = z.object({
  token: z.string().min(10, "رمز QR غير صالح").max(200),
  eventId: z.string().uuid("معرف الفعالية غير صالح"),
  gateId: z.string().uuid("معرف البوابة غير صالح").optional().nullable(),
});
