import { Request, Response } from "express";
import * as registrationService from "../services/registrationService";
import { PrismaClient } from "@prisma/client";
import { logAudit } from "../services/auditService";

const prisma = new PrismaClient();

export async function register(req: Request, res: Response) {
  try {
    const result = await registrationService.registerAttendee(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: "REGISTRATION_FAILED", message: result.error },
      });
    }

    // ✅ تسجيل التسجيل الجديد
    if (result.data && (result.data as any).eventId) {
      // نحتاج إلى userId وهمي لأنه تسجيل عام
      // يمكننا استخدام ID المنظم أو تخطي التسجيل لعدم وجود مستخدم
      // نستخدم organizerId من الفعالية
    }

    return res.status(201).json({
      success: true,
      data: result.data,
      message: result.message || "تم التسجيل بنجاح",
      waitlisted: result.waitlisted || false,
    });
  } catch (error) {
    console.error("خطأ في تسجيل الحضور:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء التسجيل",
      },
    });
  }
}

export async function getRegistrations(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    const result = await registrationService.getRegistrationsByEvent(
      String(eventId),
      organizerId,
    );

    if (!result.success) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: result.error,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("خطأ في جلب التسجيلات:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء جلب التسجيلات",
      },
    });
  }
}

export async function approveRegistration(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;

    const result = await registrationService.approveRegistration(
      String(id),
      organizerId,
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: "APPROVAL_FAILED", message: result.error },
      });
    }

    // ✅ تسجيل الموافقة
    await logAudit({
      userId: organizerId,
      action: "REGISTRATION_APPROVED",
      details: { registrationId: id, eventId: result.data?.eventId },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error("خطأ في الموافقة على التسجيل:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء الموافقة على التسجيل",
      },
    });
  }
}

export async function rejectRegistration(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;

    const result = await registrationService.rejectRegistration(
      String(id),
      organizerId,
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: "REJECTION_FAILED", message: result.error },
      });
    }

    // ✅ تسجيل الرفض
    await logAudit({
      userId: organizerId,
      action: "REGISTRATION_REJECTED",
      details: { registrationId: id, eventId: result.data?.eventId },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error("خطأ في رفض التسجيل:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء رفض التسجيل",
      },
    });
  }
}

export async function getRegistrationByToken(req: Request, res: Response) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_TOKEN",
          message: "رمز QR مطلوب",
        },
      });
    }

    const result = await registrationService.getRegistrationByToken(
      String(token),
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: result.error || "رمز QR غير صالح",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("خطأ في جلب بيانات رمز QR:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء جلب بيانات رمز QR",
      },
    });
  }
}

export async function getWaitlist(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: "EVENT_NOT_FOUND", message: "الفعالية غير موجودة" },
      });
    }

    if (event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "ليس لديك صلاحية لعرض قائمة الانتظار",
        },
      });
    }

    const waitlist = await prisma.waitlist.findMany({
      where: { eventId: String(eventId), status: "WAITING" },
      orderBy: { registeredAt: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: waitlist,
    });
  } catch (error) {
    console.error("خطأ في جلب قائمة الانتظار:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء جلب قائمة الانتظار",
      },
    });
  }
}
