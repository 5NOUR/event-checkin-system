import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. جلب إشعارات المستخدم
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0,
) {
  try {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

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

// 2. تحديد إشعار كمقروء
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return { success: false, error: "الإشعار غير موجود" };
    }

    if (notification.userId !== userId) {
      return { success: false, error: "ليس لديك صلاحية لتعديل هذا الإشعار" };
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("خطأ في تحديث الإشعار:", error);
    return { success: false, error: "حدث خطأ أثناء تحديث الإشعار" };
  }
}

// 3. تحديد جميع الإشعارات كمقروءة
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true, message: "تم تحديث جميع الإشعارات كمقروءة" };
  } catch (error) {
    console.error("خطأ في تحديث الكل:", error);
    return { success: false, error: "حدث خطأ أثناء تحديث الإشعارات" };
  }
}

// 4. حذف إشعار
export async function deleteNotification(
  notificationId: string,
  userId: string,
) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return { success: false, error: "الإشعار غير موجود" };
    }

    if (notification.userId !== userId) {
      return { success: false, error: "ليس لديك صلاحية لحذف هذا الإشعار" };
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true, message: "تم حذف الإشعار" };
  } catch (error) {
    console.error("خطأ في حذف الإشعار:", error);
    return { success: false, error: "حدث خطأ أثناء حذف الإشعار" };
  }
}

// 5. إنشاء إشعار (دالة مساعدة)
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  relatedEntityType?: string,
  relatedEntityId?: string,
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
        isRead: false,
      },
    });
    return notification;
  } catch (error) {
    console.error("خطأ في إنشاء الإشعار:", error);
    throw error;
  }
}
