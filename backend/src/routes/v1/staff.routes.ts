import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import * as staffController from "../../controllers/staffController";
import { validate } from "../../middleware/validate";
import { addStaffSchema } from "../../validators/staff.validator";
import {
  eventIdParamSchema,
  uuidParamSchema,
} from "../../validators/common.validator";

const router = Router();

router.use(authenticateToken);
router.use(requireRole([Role.ORGANIZER, Role.ADMIN]));

router.get(
  "/event/:eventId",
  validate({ params: eventIdParamSchema }),
  staffController.getEventStaff,
);
router.post(
  "/event/:eventId",
  validate({ params: eventIdParamSchema, body: addStaffSchema }),
  staffController.addStaffToEvent,
);
router.delete(
  "/event/:eventId/staff/:staffId",
  staffController.removeStaffFromEvent,
);
router.patch(
  "/event/:eventId/staff/:staffId/reactivate",
  staffController.reactivateStaff,
);

export default router;
