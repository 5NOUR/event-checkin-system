import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import * as registrationController from "../../controllers/registrationController";
import { validate } from "../../middleware/validate";
import { createRegistrationSchema } from "../../validators/registration.validator";
import {
  uuidParamSchema,
  eventIdParamSchema,
  tokenParamSchema,
} from "../../validators/common.validator";
import { registrationLimiter } from "../../middleware/rateLimiter";

const router = Router();

// ✅ Public routes
router.post(
  "/",
  registrationLimiter,
  validate({ body: createRegistrationSchema }),
  registrationController.register,
);
router.get(
  "/qr/:token",
  validate({ params: tokenParamSchema }),
  registrationController.getRegistrationByToken,
);

// ✅ Protected routes
router.use(authenticateToken);
router.use(requireRole([Role.ORGANIZER, Role.ADMIN]));

router.get(
  "/event/:eventId",
  validate({ params: eventIdParamSchema }),
  registrationController.getRegistrations,
);
router.post(
  "/:id/approve",
  validate({ params: uuidParamSchema }),
  registrationController.approveRegistration,
);
router.post(
  "/:id/reject",
  validate({ params: uuidParamSchema }),
  registrationController.rejectRegistration,
);
router.get(
  "/waitlist/:eventId",
  validate({ params: eventIdParamSchema }),
  registrationController.getWaitlist,
);

export default router;
