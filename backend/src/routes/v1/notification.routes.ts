import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import * as notificationController from "../../controllers/notificationController";

const router = Router();

// جميع المسارات تتطلب مصادقة
router.use(authenticateToken);

// GET /api/v1/notifications
router.get("/", notificationController.getNotifications);

// PATCH /api/v1/notifications/:id/read
router.patch("/:id/read", notificationController.markNotificationAsRead);

// PATCH /api/v1/notifications/read-all
router.patch("/read-all", notificationController.markAllNotificationsAsRead);

// DELETE /api/v1/notifications/:id
router.delete("/:id", notificationController.deleteNotification);

export default router;
