import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import * as notificationController from "../../controllers/notificationController";
import { validate } from "../../middleware/validate";
import { uuidParamSchema } from "../../validators/common.validator";

const router = Router();

router.use(authenticateToken);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch(
  "/:id/read",
  validate({ params: uuidParamSchema }),
  notificationController.markNotificationAsRead,
);
router.patch("/read-all", notificationController.markAllNotificationsAsRead);
router.delete(
  "/:id",
  validate({ params: uuidParamSchema }),
  notificationController.deleteNotification,
);

export default router;
