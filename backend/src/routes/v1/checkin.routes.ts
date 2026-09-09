import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import * as checkInController from "../../controllers/checkInController";

const router = Router();

// جميع مسارات الـ Check-in تتطلب مصادقة ودور STAFF أو ORGANIZER أو ADMIN
router.use(authenticateToken);
router.use(requireRole([Role.STAFF, Role.ORGANIZER, Role.ADMIN]));

// POST /api/v1/checkin/verify - التحقق من رمز QR وتسجيل الدخول
router.post("/verify", checkInController.verifyAndCheckIn);

export default router;
