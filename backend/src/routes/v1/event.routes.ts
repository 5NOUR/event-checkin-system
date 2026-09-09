import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import * as eventController from "../../controllers/eventController";

const router = Router();

// ✅ مسار عام (بدون مصادقة) - جلب تفاصيل فعالية للزوار باستخدام slug
router.get("/public/:slug", eventController.getPublicEventBySlug);

// ❌ باقي المسارات محمية (تتطلب توكن ودور مناسب)
router.use(authenticateToken);
router.use(requireRole([Role.ORGANIZER, Role.ADMIN]));

// POST /api/v1/events - إنشاء فعالية جديدة
router.post("/", eventController.createEvent);

// GET /api/v1/events - جلب قائمة الفعاليات
router.get("/", eventController.getEvents);

// GET /api/v1/events/:id - جلب تفاصيل فعالية (خاصة)
router.get("/:id", eventController.getEventById);

// PATCH /api/v1/events/:id - تحديث فعالية
router.patch("/:id", eventController.updateEvent);

// PATCH /api/v1/events/:id/status - تغيير حالة الفعالية
router.patch("/:id/status", eventController.updateEventStatus);
// مسار الإحصائيات (بعد middleware المصادقة)
router.get("/:id/stats", eventController.getEventStats);
// مسار التحليلات المتقدمة (بعد middleware المصادقة)
router.get("/:id/analytics", eventController.getEventAnalytics);

export default router;
