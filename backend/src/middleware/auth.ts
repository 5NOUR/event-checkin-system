import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

// توسيع نوع Request لإضافة user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: Role;
      };
    }
  }
}

// دالة للتحقق من صحة التوكن
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "أنت غير مصرح لك. يرجى تسجيل الدخول.",
      },
    });
  }

  const secret = process.env.JWT_SECRET || "default-secret-change-this";

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "الرمز غير صالح أو منتهي الصلاحية.",
        },
      });
    }

    // تخزين بيانات المستخدم في الطلب للاستخدام في المسارات المحمية
    req.user = decoded as { userId: string; email: string; role: Role };
    next();
  });
}

// دالة للتحقق من دور المستخدم (RBAC)
export function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "أنت غير مصرح لك.",
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "ليس لديك الصلاحية الكافية للقيام بهذا الإجراء.",
        },
      });
    }

    next();
  };
}
