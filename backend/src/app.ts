import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import apiRoutes from "./routes/v1";
import {
  loginLimiter,
  publicLimiter,
  apiLimiter,
} from "./middleware/rateLimiter";

// تحميل متغيرات البيئة
dotenv.config();

const app = express();

// ============================================================
// 🔒 الأمان
// ============================================================

// 1. Helmet - حماية رؤوس HTTP
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// 2. CORS - السماح فقط بالمجالات المصرح بها
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 3. Rate Limiting - منع الهجمات
app.use("/api/v1/auth/login", loginLimiter); // 10 محاولات لكل 15 دقيقة
app.use("/api/v1/registrations", publicLimiter); // 60 طلب في الدقيقة
app.use("/api/v1", apiLimiter); // 100 طلب في الدقيقة لباقي المسارات

// ============================================================
// 🧩 Middlewares الأساسية
// ============================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// 📡 نقاط النهاية
// ============================================================

// نقطة نهاية صحية للتأكد من أن الخادم يعمل
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// جميع مسارات API
app.use("/api/v1", apiRoutes);

// ============================================================
// ❌ معالج الأخطاء العام (يجب أن يكون في النهاية)
// ============================================================

app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "حدث خطأ داخلي في الخادم",
    },
  });
});

export default app;
