import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import * as registrationController from "../../controllers/registrationController";

const router = Router();
// مسار عام لعرض رمز QR (بدون مصادقة)

// ... باقي المسارات (المحمية) كما هي
// المسار العام (بدون مصادقة) لتسجيل الحضور - موجود مسبقاً
router.post("/", registrationController.register);
router.get("/qr/:token", registrationController.getRegistrationByToken);

// جميع المسارات التالية محمية وتتطلب دور ORGANIZER أو ADMIN
router.use(authenticateToken);
router.use(requireRole([Role.ORGANIZER, Role.ADMIN]));

// GET /api/v1/registrations/event/:eventId - جلب تسجيلات فعالية
router.get("/event/:eventId", registrationController.getRegistrations);

// POST /api/v1/registrations/:id/approve - الموافقة على تسجيل
router.post("/:id/approve", registrationController.approveRegistration);

// POST /api/v1/registrations/:id/reject - رفض تسجيل
router.post("/:id/reject", registrationController.rejectRegistration);

export default router;
