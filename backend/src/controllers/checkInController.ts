import { Request, Response } from "express";
import * as registrationService from "../services/registrationService";
import { logAudit } from "../services/auditService";

// التحقق من رمز QR وتسجيل الدخول
export async function verifyAndCheckIn(req: Request, res: Response) {
  try {
    const { token, eventId, gateId } = req.body;
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
      gateId ? String(gateId) : undefined,
    );

    if (!result.success) {
      // ✅ تحديد رمز الحالة داخل البلوك
      let statusCode = 400;
      if (result.code === "WRONG_EVENT") statusCode = 400;
      else if (result.code === "NOT_APPROVED") statusCode = 403;
      else if (result.code === "ALREADY_CHECKED_IN") statusCode = 409;
      else if (result.code === "WRONG_TICKET_TYPE") statusCode = 403;

      // ✅ تسجيل محاولة فاشلة
      await logAudit({
        userId: staffUserId,
        action: "CHECKIN_FAILED",
        details: {
          reason: result.error,
          code: result.code,
          eventId,
          gateId: gateId || null,
        },
        ipAddress: req.ip,
      });

      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.code || "CHECKIN_FAILED",
          message: result.error,
          checkedInAt: result.checkedInAt || null,
        },
      });
    }

    // ✅ تسجيل النجاح
    await logAudit({
      userId: staffUserId,
      action: "CHECKIN_QR_SUCCESS",
      details: {
        attendeeName: result.data?.attendeeName,
        eventId,
        gateId: gateId || null,
      },
      ipAddress: req.ip,
    });

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
