import { Request, Response } from "express";
import { registerAttendee } from "../services/registrationService";
import { createRegistrationSchema } from "../validators/registration.validator";
import * as registrationService from "../services/registrationService";

export async function register(req: Request, res: Response) {
  try {
    // التحقق من صحة البيانات
    const validationResult = createRegistrationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "بيانات غير صحيحة",
          details: validationResult.error.issues,
        },
      });
    }

    const result = await registerAttendee(validationResult.data);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "REGISTRATION_FAILED",
          message: result.error,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
      message: result.message,
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

// الموافقة على تسجيل
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
        error: {
          code: "APPROVAL_FAILED",
          message: result.error,
        },
      });
    }

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

// رفض تسجيل
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
        error: {
          code: "REJECTION_FAILED",
          message: result.error,
        },
      });
    }

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
// جلب بيانات التسجيل عن طريق رمز QR (عام - بدون مصادقة)
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
          message: result.error,
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
