import { Request, Response } from "express";
import * as staffService from "../services/staffService";

// جلب قائمة الموظفين لفعالية
export async function getEventStaff(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    const result = await staffService.getEventStaff(
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
    console.error("خطأ في جلب قائمة الموظفين:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء جلب قائمة الموظفين",
      },
    });
  }
}

// إضافة موظف إلى فعالية
export async function addStaffToEvent(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { email, name } = req.body;
    const organizerId = req.user!.userId;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_EMAIL",
          message: "البريد الإلكتروني مطلوب",
        },
      });
    }

    const result = await staffService.addStaffToEvent(
      String(eventId),
      organizerId,
      email,
      name || "",
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ADD_STAFF_FAILED",
          message: result.error,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
      message: "تم إضافة الموظف بنجاح",
    });
  } catch (error) {
    console.error("خطأ في إضافة الموظف:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء إضافة الموظف",
      },
    });
  }
}

// إزالة موظف من فعالية (تعطيل)
export async function removeStaffFromEvent(req: Request, res: Response) {
  try {
    const { eventId, staffId } = req.params;
    const organizerId = req.user!.userId;

    const result = await staffService.removeStaffFromEvent(
      String(eventId),
      organizerId,
      String(staffId),
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "REMOVE_STAFF_FAILED",
          message: result.error,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: "تم تعطيل الموظف بنجاح",
    });
  } catch (error) {
    console.error("خطأ في إزالة الموظف:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء إزالة الموظف",
      },
    });
  }
}

// إعادة تفعيل موظف
export async function reactivateStaff(req: Request, res: Response) {
  try {
    const { eventId, staffId } = req.params;
    const organizerId = req.user!.userId;

    const result = await staffService.reactivateStaff(
      String(eventId),
      organizerId,
      String(staffId),
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "REACTIVATE_STAFF_FAILED",
          message: result.error,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: "تم إعادة تفعيل الموظف بنجاح",
    });
  } catch (error) {
    console.error("خطأ في إعادة تفعيل الموظف:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء إعادة تفعيل الموظف",
      },
    });
  }
}
