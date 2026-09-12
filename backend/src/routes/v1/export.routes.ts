import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import { exportCsv } from "../../controllers/exportController";
import { validate } from "../../middleware/validate";
import { eventIdParamSchema } from "../../validators/common.validator";

const router = Router();

router.use(authenticateToken);
router.use(requireRole([Role.ORGANIZER, Role.ADMIN]));

router.get(
  "/event/:eventId/csv",
  validate({ params: eventIdParamSchema }),
  exportCsv,
);

export default router;
