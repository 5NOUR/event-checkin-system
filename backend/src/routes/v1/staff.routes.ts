import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import * as staffController from "../../controllers/staffController";

const router = Router();

// جميع مسارات إدارة الموظفين تتطلب مصادقة ودور ORGANIZER أو ADMIN
router.use(authenticateToken);
router.use(requireRole([Role.ORGANIZER, Role.ADMIN]));

// GET /api/v1/staff/event/:eventId - جلب قائمة الموظفين لفعالية
router.get("/event/:eventId", staffController.getEventStaff);

// POST /api/v1/staff/event/:eventId - إضافة موظف إلى فعالية
router.post("/event/:eventId", staffController.addStaffToEvent);

// DELETE /api/v1/staff/event/:eventId/staff/:staffId - إزالة موظف من فعالية
router.delete(
  "/event/:eventId/staff/:staffId",
  staffController.removeStaffFromEvent,
);

// PATCH /api/v1/staff/event/:eventId/staff/:staffId/reactivate - إعادة تفعيل موظف
router.patch(
  "/event/:eventId/staff/:staffId/reactivate",
  staffController.reactivateStaff,
);

export default router;
