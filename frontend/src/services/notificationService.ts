import apiClient from "./apiClient";

// تعريف نوع الإشعار الكامل
export interface Notification {
  id: string;
  userId: string;
  type: string; // registration, approval, rejection, etc.
  title: string;
  message: string;
  isRead: boolean;
  priority?: string; // low, medium, high
  metadata?: unknown; // بيانات إضافية
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

// معاملات جلب الإشعارات
export interface GetNotificationsParams {
  limit?: number;
  offset?: number;
  type?: string;
  isRead?: boolean;
  priority?: string;
}

// جلب الإشعارات مع التصفية
export async function getNotifications(params: GetNotificationsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append("limit", String(params.limit));
  if (params.offset) queryParams.append("offset", String(params.offset));
  if (params.type) queryParams.append("type", params.type);
  if (params.isRead !== undefined)
    queryParams.append("isRead", String(params.isRead));
  if (params.priority) queryParams.append("priority", params.priority);

  const response = await apiClient.get(
    `/notifications?${queryParams.toString()}`,
  );
  return response.data.data;
}

// تحديد إشعار كمقروء
export async function markNotificationAsRead(id: string) {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
}

// تحديد الكل كمقروء
export async function markAllNotificationsAsRead() {
  const response = await apiClient.patch("/notifications/read-all");
  return response.data;
}

// حذف إشعار
export async function deleteNotification(id: string) {
  const response = await apiClient.delete(`/notifications/${id}`);
  return response.data;
}

// الحصول على عدد الإشعارات غير المقروءة (لـ Badge)
export async function getUnreadCount() {
  const response = await apiClient.get("/notifications/unread-count");
  return response.data.data.unreadCount;
}
