import apiClient from "./apiClient";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

export async function getNotifications(limit = 20, offset = 0) {
  const response = await apiClient.get(
    `/notifications?limit=${limit}&offset=${offset}`,
  );
  return response.data.data;
}

export async function markNotificationAsRead(id: string) {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsAsRead() {
  const response = await apiClient.patch("/notifications/read-all");
  return response.data;
}

export async function deleteNotification(id: string) {
  const response = await apiClient.delete(`/notifications/${id}`);
  return response.data;
}
