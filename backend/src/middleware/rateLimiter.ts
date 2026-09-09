import rateLimit from "express-rate-limit";

// منع محاولات تسجيل الدخول المتكررة
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10, // 10 محاولات فقط
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message:
        "لقد تجاوزت عدد المحاولات المسموح بها. يرجى المحاولة بعد 15 دقيقة.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// منع الطلبات المفرطة على نقاط النهاية العامة
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: 60, // 60 طلب في الدقيقة
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "لقد تجاوزت عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// منع الطلبات المفرطة على نقاط النهاية المحمية
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 طلب في الدقيقة
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "لقد تجاوزت عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
