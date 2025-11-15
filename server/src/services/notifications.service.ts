import { query, withTransaction } from "@config/database";
import type { UUID, Notification } from "@types";

/**
 * Service for managing user notifications
 */
export default class NotificationsService {
  /**
   * Gets notifications for a user.
   * @param userId The ID of the user.
   * @returns A list of notifications.
   */
  static async getNotifications(
    userId: UUID,
    includeRead = false
  ): Promise<Notification[]> {
    try {
      const result = await query(
        `SELECT * FROM user_notifications
        WHERE user_id = $1 AND ($2::boolean OR is_read = FALSE)
        ORDER BY notified_at DESC`,
        [userId, includeRead]
      );
      return result;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  /**
   * Marks a notification as read.
   * @param userId The ID of the user.
   * @param notificationId The ID of the notification.
   */
  static async markAsRead(userId: UUID, notificationId: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE user_notifications 
          SET is_read = TRUE, read_at = NOW() 
          WHERE user_id = $1 AND id = $2`,
          [userId, notificationId]
        );
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Marks all notifications as read for a user.
   * @param userId The ID of the user.
   */
  static async markAllAsRead(userId: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE user_notifications
          SET is_read = TRUE, read_at = NOW()
          WHERE user_id = $1 AND is_read = FALSE`,
          [userId]
        );
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }
}
