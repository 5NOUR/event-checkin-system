import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import { generalLimiter } from "./middleware/rateLimiter";
import apiRoutes from "./routes/v1";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// ✅ Helmet مع إعدادات محسّنة
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || "http://localhost:5173",
        ],
        frameSrc: ["'self'", "https://www.openstreetmap.org"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);

// ✅ CORS محسّن (يسمح فقط للنطاقات المصرح بها)
// ✅ قائمة النطاقات المسموح بها
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:4173",
  // في الإنتاج، FRONTEND_URL سيحتوي على النطاق الحقيقي
].filter(Boolean);

console.log("✅ Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // السماح بالطلبات بدون origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`⛔ Blocked CORS origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Expires",
    ],
    maxAge: 86400,
  }),
);
// ✅ Cookie Parser
app.use(cookieParser());

// ✅ Body Parser مع حدود للحماية من DoS
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ✅ حماية من Parameter Pollution
app.use((req, res, next) => {
  // منع تلوث المعاملات
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key]) && !key.includes("[]")) {
        // نأخذ القيمة الأولى فقط
        (req.query as any)[key] = (req.query as any)[key][0];
      }
    }
  }
  next();
});

// ✅ Rate Limiting العام
app.use("/api/v1", generalLimiter);

// ✅ Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ✅ Routes
app.use("/api/v1", apiRoutes);

// ✅ خدمة الملفات المرفوعة (مع حماية)
app.use(
  "/uploads",
  (req, res, next) => {
    // منع path traversal
    if (req.path.includes("..") || req.path.includes("%2e")) {
      return res.status(400).json({ error: "Invalid path" });
    }
    next();
  },
  express.static("uploads", {
    dotfiles: "deny",
    index: false,
    maxAge: "1d",
  }),
);

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "المسار غير موجود",
    },
  });
});

// ✅ Error Handler مركزي (لا يكشف تفاصيل داخلية)
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("❌ Server Error:", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      path: req.path,
      method: req.method,
    });

    // لا نكشف تفاصيل الخطأ في الإنتاج
    const message =
      process.env.NODE_ENV === "production"
        ? "حدث خطأ داخلي في الخادم"
        : err.message;

    res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message,
      },
    });
  },
);

export default app;
