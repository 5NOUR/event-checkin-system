import { Request, Response } from "express";
import * as authService from "../services/authService";
import { PrismaClient } from "@prisma/client";
import * as passwordResetService from "../services/passwordResetService";
import { logAudit } from "../services/auditService";

const prisma = new PrismaClient();

// 1️⃣ تسجيل الدخول
// 1️⃣ تسجيل الدخول
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "البريد الإلكتروني وكلمة المرور مطلوبان.",
        },
      });
    }

    const result = await authService.login(
      email,
      password,
      req.ip,
      req.headers["user-agent"],
    );

    if (!result.success) {
      // Audit log
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await logAudit({
          userId: user.id,
          action: "LOGIN_FAILED",
          details: { email },
          ipAddress: req.ip,
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: result.error,
        },
      });
    }

    if (!result.data) {
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "حدث خطأ غير متوقع أثناء تسجيل الدخول.",
        },
      });
    }

    const { accessToken, refreshToken, user } = result.data;

    // ✅ إعدادات Cookie للإنتاج (Cross-Origin)
    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // ✅ true في الإنتاج (HTTPS)
      sameSite: (isProduction ? "none" : "lax") as "none" | "lax", // ✅ none في الإنتاج
      path: "/",
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 دقيقة
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
    });

    // Audit log
    await logAudit({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      details: { email },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: { user },
      message: "تم تسجيل الدخول بنجاح.",
    });
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ داخلي في الخادم.",
      },
    });
  }
}

// 2️⃣ تسجيل الخروج
export async function logout(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
      path: "/",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    if (userId) {
      await logAudit({
        userId,
        action: "LOGOUT",
        ipAddress: req.ip,
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم تسجيل الخروج بنجاح.",
    });
  } catch (error) {
    console.error("خطأ في تسجيل الخروج:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء تسجيل الخروج.",
      },
    });
  }
}

// 3️⃣ تجديد Access Token
// 3️⃣ تجديد Access Token
export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Refresh token مطلوب." },
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    if (!result.success || !result.data) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_REFRESH_TOKEN",
          message: result.error || "فشل تجديد الجلسة.",
        },
      });
    }

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("accessToken", result.data.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "تم تجديد الجلسة بنجاح.",
    });
  } catch (error) {
    console.error("خطأ في تجديد التوكن:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء تجديد الجلسة.",
      },
    });
  }
}

// 4️⃣ الحصول على بيانات المستخدم الحالي (للتحقق من الصلاحية)
export async function me(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "غير مصرح" },
      });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    return res.status(200).json({ success: true, data: userData });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: { message: "خطأ في الخادم" } });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_EMAIL", message: "البريد الإلكتروني مطلوب." },
      });
    }

    const result = await passwordResetService.requestPasswordReset(email);

    // ✅ تسجيل الطلب (نحاول جلب userId)
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await logAudit({
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        ipAddress: req.ip,
      });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error("خطأ في طلب إعادة التعيين:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ داخلي." },
    });
  }
}

// 6️⃣ إعادة تعيين كلمة المرور
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "الرمز وكلمة المرور مطلوبان.",
        },
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
        },
      });
    }

    const result = await passwordResetService.resetPassword(token, newPassword);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: result.error },
      });
    }

    // ✅ نحتاج إلى userId — نجلبه من خلال token التحقق
    // يمكن تعديل `resetPassword` في الخدمة لإرجاع userId
    // (اختياري) أو نتركه بدون userId

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error("خطأ في إعادة تعيين كلمة المرور:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ داخلي." },
    });
  }
}
// 7️⃣ تغيير كلمة المرور (للمستخدم المسجل)
export async function changePassword(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "كلمة المرور الحالية والجديدة مطلوبان.",
        },
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.",
        },
      });
    }

    const result = await authService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_PASSWORD", message: result.error },
      });
    }

    // ✅ تسجيل تغيير كلمة المرور
    await logAudit({
      userId,
      action: "PASSWORD_CHANGED",
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("خطأ في تغيير كلمة المرور:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ داخلي." },
    });
  }
}
