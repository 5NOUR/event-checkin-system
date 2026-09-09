import { Request, Response } from "express";
import { loginUser } from "../services/authService";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // التحقق من وجود البريد وكلمة المرور في الطلب
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "البريد الإلكتروني وكلمة المرور مطلوبان.",
        },
      });
    }

    const result = await loginUser(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: result.error,
        },
      });
    }

    // إرجاع البيانات بنجاح
    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً.",
      },
    });
  }
}
