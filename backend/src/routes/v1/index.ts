import { Router } from "express";
import authRoutes from "./auth.routes";
import eventRoutes from "./event.routes";
import registrationRoutes from "./registration.routes";
import checkinRoutes from "./checkin.routes"; // <-- أضف هذا
import staffRoutes from "./staff.routes";
import notificationRoutes from "./notification.routes";
import exportRoutes from "./export.routes";
import contentRoutes from "./content.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/events", eventRoutes);
router.use("/registrations", registrationRoutes);
router.use("/checkin", checkinRoutes); // <-- أضف هذا
router.use("/staff", staffRoutes);
router.use("/notifications", notificationRoutes);
router.use("/export", exportRoutes);
router.use("/content", contentRoutes);

export default router;
