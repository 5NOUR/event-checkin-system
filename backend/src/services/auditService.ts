import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// أنواع الإجراءات المسجلة
export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "EVENT_PUBLISHED"
  | "EVENT_STATUS_CHANGED"
  | "EVENT_CANCELLED"
  | "REGISTRATION_CREATED"
  | "REGISTRATION_APPROVED"
  | "REGISTRATION_REJECTED"
  | "REGISTRATION_WAITLISTED"
  | "REGISTRATION_PROMOTED"
  | "CHECKIN_QR_SUCCESS"
  | "CHECKIN_MANUAL"
  | "CHECKIN_FAILED"
  | "STAFF_ASSIGNED"
  | "STAFF_REMOVED"
  | "STAFF_REACTIVATED"
  | "EXPORT_GENERATED"
  | "USER_DISABLED"
  | "USER_ENABLED";

interface AuditLogInput {
  userId: string;
  action: AuditAction;
  details?: Record<string, any>;
  ipAddress?: string;
}

// الدالة الأساسية لتسجيل الإجراءات
export async function logAudit(data: AuditLogInput): Promise<void> {
  try {
    // نتجاهل تفاصيل حساسة تماماً
    const sanitizedDetails = data.details
      ? sanitizeDetails(data.details)
      : undefined;

    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        details: sanitizedDetails,
        ipAddress: data.ipAddress,
      },
    });
  } catch (error) {
    // لا نفشل العملية الأساسية بسبب فشل التسجيل
    console.error("⚠️ فشل تسجيل Audit Log:", error);
  }
}

// إزالة البيانات الحساسة من التفاصيل
function sanitizeDetails(details: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    "password",
    "passwordHash",
    "currentPassword",
    "newPassword",
    "token",
    "accessToken",
    "refreshToken",
    "passwordResetToken",
    "secret",
  ];

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(details)) {
    if (sensitiveKeys.includes(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      sanitized[key] = sanitizeDetails(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// جلب سجل التدقيق (للـ Admin)
export async function getAuditLogs(options: {
  userId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (options.userId) where.userId = options.userId;
  if (options.action) where.action = options.action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: options.offset || 0,
      take: options.limit || 50,
      include: {
        user: {
          select: { email: true, name: true, role: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}
