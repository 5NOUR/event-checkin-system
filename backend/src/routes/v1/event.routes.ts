import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import * as eventController from "../../controllers/eventController";
import { validate } from "../../middleware/validate";
import {
  createEventSchema,
  updateEventSchema,
  updateEventStatusSchema,
} from "../../validators/event.validator";
import {
  uuidParamSchema,
  slugParamSchema,
} from "../../validators/common.validator";

const router = Router();

// ========================================
// ✅ Public Routes (no auth)
// ========================================
router.get("/public", eventController.getPublicEvents);
router.get(
  "/public/:slug",
  validate({ params: slugParamSchema }),
  eventController.getPublicEventBySlug,
);

// ========================================
// ✅ Staff Route (auth + STAFF role)
// ⚠️ يجب أن يكون قبل requireRole([ORGANIZER, ADMIN])
// ========================================
router.get(
  "/staff",
  authenticateToken,
  requireRole([Role.STAFF]),
  eventController.getStaffEvents,
);

// ========================================
// ✅ Organizer & Admin Routes
// ========================================
router.use(authenticateToken);
router.use(requireRole([Role.ORGANIZER, Role.ADMIN]));

router.post(
  "/",
  validate({ body: createEventSchema }),
  eventController.createEvent,
);
router.get("/", eventController.getEvents);
router.get(
  "/:id",
  validate({ params: uuidParamSchema }),
  eventController.getEventById,
);
router.patch(
  "/:id",
  validate({ params: uuidParamSchema, body: updateEventSchema }),
  eventController.updateEvent,
);
router.patch(
  "/:id/status",
  validate({ params: uuidParamSchema, body: updateEventStatusSchema }),
  eventController.updateEventStatus,
);
router.get(
  "/:id/stats",
  validate({ params: uuidParamSchema }),
  eventController.getEventStats,
);
router.get(
  "/:id/analytics",
  validate({ params: uuidParamSchema }),
  eventController.getEventAnalytics,
);

export default router;
