import api from "./api";
import type { UUID, Notification } from "@types";

export const notificationsApi = {
  async getNotifications(userId: UUID, includeRead = false) {
    const response = await api.get<Notification[]>(
      `/users/${userId}/notifications`,
      {
        params: { includeRead },
      }
    );
    return response.data;
  },

  async hasUnreadNotifications(userId: UUID) {
    const response = await api.get<{ hasUnread: boolean }>(
      `/users/${userId}/notifications/check`
    );
    return response.data.hasUnread;
  },

  async markAsRead(userId: UUID, notificationId: UUID) {
    await api.put(`/users/${userId}/notifications/${notificationId}/read`);
  },

  async markAllAsRead(userId: UUID) {
    await api.put(`/users/${userId}/notifications/read-all`);
  },

  async archive(userId: UUID, notificationId: UUID) {
    await api.put(`/users/${userId}/notifications/${notificationId}/archive`);
  },

  async archiveAll(userId: UUID) {
    await api.put(`/users/${userId}/notifications/archive-all`);
  },
};
