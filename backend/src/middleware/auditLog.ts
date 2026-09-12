import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// أنواع الإجراءات التي يتم تسجيلها
export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DISABLED"
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "EVENT_PUBLISHED"
  | "EVENT_CANCELLED"
  | "REGISTRATION_APPROVED"
  | "REGISTRATION_REJECTED"
  | "REGISTRATION_CANCELLED"
  | "CHECKIN_MANUAL"
  | "CHECKIN_QR"
  | "STAFF_ASSIGNED"
  | "STAFF_REMOVED"
  | "EXPORT_GENERATED";

export async function logAudit(data: {
  userId: string;
  action: AuditAction;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        details: data.details || {},
        ipAddress: data.ipAddress,
      },
    });
  } catch (error) {
    // لا نفشل العملية الأساسية بسبب فشل التسجيل
    console.error("⚠️ Failed to log audit:", error);
  }
}

// Middleware اختياري لتسجيل جميع الطلبات
export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // نضيف دالة مساعدة إلى req لتسجيل الأحداث
  (req as any).audit = (action: AuditAction, details?: Record<string, any>) => {
    if (req.user) {
      return logAudit({
        userId: req.user.userId,
        action,
        details,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }
  };
  next();
}
