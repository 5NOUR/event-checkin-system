import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import * as checkInController from "../../controllers/checkInController";
import * as contentController from "../../controllers/contentController";
import { validate } from "../../middleware/validate";
import { verifyCheckInSchema } from "../../validators/checkin.validator";
import { eventIdParamSchema } from "../../validators/common.validator";

const router = Router();

router.use(authenticateToken);
router.use(requireRole([Role.STAFF, Role.ORGANIZER, Role.ADMIN]));

router.post(
  "/verify",
  validate({ body: verifyCheckInSchema }),
  checkInController.verifyAndCheckIn,
);
router.get(
  "/gates/:eventId",
  validate({ params: eventIdParamSchema }),
  contentController.getStaffGates,
);

export default router;
