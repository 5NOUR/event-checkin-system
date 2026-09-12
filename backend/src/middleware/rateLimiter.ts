import rateLimit from "express-rate-limit";

// ✅ بيئة الاختبار/التطوير: حدود مرتفعة جداً
const isDevelopment = process.env.NODE_ENV !== "production";

// Helper: قيم متغيرة حسب البيئة
const devOrProd = (dev: number, prod: number) => (isDevelopment ? dev : prod);

// ⛔ تسجيل الدخول
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: devOrProd(1000, 10), // 1000 في التطوير، 10 في الإنتاج
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message:
        "لقد تجاوزت عدد محاولات تسجيل الدخول المسموح بها. يرجى المحاولة بعد 15 دقيقة.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ تخطي Rate Limiting في بيئة التطوير
  skip: () => isDevelopment,
});

// ⛔ تسجيل الحضور
export const registrationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: devOrProd(1000, 50),
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message:
        "لقد تجاوزت عدد طلبات التسجيل المسموح بها. يرجى المحاولة لاحقاً.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});

// ⛔ عام
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: devOrProd(10000, 100),
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "لقد تجاوزت عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});

// ⛔ المسارات الحساسة
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: devOrProd(1000, 5),
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "لقد تجاوزت عدد المحاولات المسموح بها. يرجى المحاولة بعد ساعة.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});
