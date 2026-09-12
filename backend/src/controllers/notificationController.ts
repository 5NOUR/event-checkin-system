import { Request, Response } from "express";
import * as notificationService from "../services/notificationService";

// جلب إشعارات المستخدم
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const type = req.query.type as string | undefined;
    const isRead =
      req.query.isRead === "true"
        ? true
        : req.query.isRead === "false"
          ? false
          : undefined;
    const priority = req.query.priority as string | undefined;

    const result = await notificationService.getUserNotifications(userId, {
      limit,
      offset,
      type: type as any,
      isRead,
      priority,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("خطأ في جلب الإشعارات:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء جلب الإشعارات" },
    });
  }
}
export async function getUnreadCount(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const count = await notificationService.getUnreadCount(userId);
    return res
      .status(200)
      .json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

// تحديد إشعار كمقروء
export async function markNotificationAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await notificationService.markNotificationAsRead(
      String(id),
      userId,
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MARK_READ_FAILED",
          message: result.error,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("خطأ في تحديث الإشعار:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء تحديث الإشعار",
      },
    });
  }
}

// تحديد جميع الإشعارات كمقروءة
export async function markAllNotificationsAsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const result = await notificationService.markAllNotificationsAsRead(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MARK_ALL_READ_FAILED",
          message: result.error,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("خطأ في تحديد الكل كمقروء:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء تحديث الإشعارات",
      },
    });
  }
}

// حذف إشعار
export async function deleteNotification(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await notificationService.deleteNotification(
      String(id),
      userId,
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "DELETE_NOTIFICATION_FAILED",
          message: result.error,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("خطأ في حذف الإشعار:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء حذف الإشعار",
      },
    });
  }
}
