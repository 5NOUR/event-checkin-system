import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import { exportCsv } from "../../controllers/exportController";

const router = Router();

// جميع مسارات التصدير تتطلب مصادقة ودور ORGANIZER أو ADMIN
router.use(authenticateToken);
router.use(requireRole([Role.ORGANIZER, Role.ADMIN]));

// GET /api/v1/export/event/:eventId/csv
router.get("/event/:eventId/csv", exportCsv);

export default router;
