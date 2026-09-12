import { PrismaClient, Notification } from "@prisma/client";
import { sendEmail } from "./emailService";

const prisma = new PrismaClient();

// ============ Types ============
export type NotificationType =
  | "registration"
  | "approval"
  | "rejection"
  | "waitlist_promotion"
  | "reminder"
  | "system"
  | "event_update"
  | "staff_assignment";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  sendEmail?: boolean;
}

// ✅ نوع موحد لكل النتائج
type ServiceResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// ============ Create Notification ============
export async function createNotification(
  data: CreateNotificationInput,
): Promise<Notification> {
  if (!data.userId || !data.type || !data.title || !data.message) {
    throw new Error(
      "بيانات الإشعار غير مكتملة: userId, type, title, message مطلوبة.",
    );
  }

  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || "medium",
      metadata: (data.metadata as object) || {},
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
    },
  });

  if (data.sendEmail) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true },
    });

    if (user) {
      try {
        await sendEmail({
          to: user.email,
          subject: data.title,
          html: `
            <h2>${data.title}</h2>
            <p>${data.message}</p>
            <p>مع خالص التحية،<br/>فريق EventCheck</p>
          `,
        });
      } catch (error) {
        console.error("فشل إرسال البريد الإلكتروني:", error);
      }
    }
  }

  return notification;
}

// ============ Get User Notifications ============
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: NotificationType;
    isRead?: boolean;
    priority?: string;
  },
): Promise<
  ServiceResult<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }>
> {
  try {
    const where: Record<string, unknown> = { userId };
    if (options?.type) where.type = options.type;
    if (options?.isRead !== undefined) where.isRead = options.isRead;
    if (options?.priority) where.priority = options.priority;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: options?.offset || 0,
        take: options?.limit || 20,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
      },
    };
  } catch (error) {
    console.error("خطأ في جلب الإشعارات:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء جلب الإشعارات",
    };
  }
}

// ============ Get Unread Count ============
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

// ============ Mark As Read ============
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<ServiceResult<Notification>> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return { success: false, error: "الإشعار غير موجود" };
    }

    if (notification.userId !== userId) {
      return {
        success: false,
        error: "ليس لديك صلاحية لتعديل هذا الإشعار",
      };
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("خطأ في تحديث الإشعار:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء تحديث الإشعار",
    };
  }
}

// ============ Mark All As Read ============
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<ServiceResult> {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return {
      success: true,
      message: "تم تحديث جميع الإشعارات كمقروءة",
    };
  } catch (error) {
    console.error("خطأ في تحديث الكل:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء تحديث الإشعارات",
    };
  }
}

// ============ Delete Notification ============
export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<ServiceResult> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return { success: false, error: "الإشعار غير موجود" };
    }

    if (notification.userId !== userId) {
      return {
        success: false,
        error: "ليس لديك صلاحية لحذف هذا الإشعار",
      };
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true, message: "تم حذف الإشعار" };
  } catch (error) {
    console.error("خطأ في حذف الإشعار:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء حذف الإشعار",
    };
  }
}
