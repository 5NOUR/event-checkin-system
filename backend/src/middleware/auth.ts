import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

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

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 1️⃣ محاولة قراءة التوكن من الـ Cookie
  let token = req.cookies?.accessToken;

  // 2️⃣ إذا لم يكن في الـ Cookie، حاول من الـ Authorization header
  if (!token) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "أنت غير مصرح لك." },
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret-change-this",
    ) as any;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: { code: "TOKEN_EXPIRED", message: "انتهت صلاحية الجلسة." },
      });
    }
    return res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "الرمز غير صالح." },
    });
  }
}

// دالة requireRole تبقى كما هي (تتحقق من req.user.role)
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
