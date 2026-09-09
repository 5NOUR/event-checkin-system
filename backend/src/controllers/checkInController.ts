import { Request, Response } from "express";
import * as registrationService from "../services/registrationService";

// التحقق من رمز QR وتسجيل الدخول
export async function verifyAndCheckIn(req: Request, res: Response) {
  try {
    const { token, eventId } = req.body;
    const staffUserId = req.user!.userId;

    // التحقق من وجود token و eventId
    if (!token || !eventId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "رمز QR ومعرف الفعالية مطلوبان",
        },
      });
    }

    const result = await registrationService.processCheckIn(
      String(token),
      String(eventId),
      staffUserId,
    );

    if (!result.success) {
      // إرجاع أخطاء محددة حسب الكود
      let statusCode = 400;
      if (result.code === "WRONG_EVENT") statusCode = 400;
      else if (result.code === "NOT_APPROVED") statusCode = 403;
      else if (result.code === "ALREADY_CHECKED_IN") statusCode = 409; // Conflict

      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.code || "CHECKIN_FAILED",
          message: result.error,
          checkedInAt: result.checkedInAt || null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error("خطأ في التحقق من QR:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء التحقق من الرمز",
      },
    });
  }
}
