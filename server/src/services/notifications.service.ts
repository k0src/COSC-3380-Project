import { query, withTransaction } from "@config/database";
import type { UUID, Notification } from "@types";

export default class NotificationsService {
  static async getNotifications(userId: UUID): Promise<Notification[]> {
    try {
      const result = await query(
        `SELECT * FROM user_notifications
        WHERE user_id = $1 
          AND archived = FALSE
          AND NOT EXISTS (
            SELECT 1 FROM deleted_users du
            WHERE du.user_id = user_notifications.user_id
          )
        ORDER BY notified_at DESC`,
        [userId]
      );
      return result;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  static async markAsRead(userId: UUID, notificationId: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE user_notifications 
          SET is_read = TRUE, read_at = NOW() 
          WHERE user_id = $1 
            AND id = $2
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du
              WHERE du.user_id = user_notifications.user_id
            )`,
          [userId, notificationId]
        );
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  static async markAllAsRead(userId: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE user_notifications
          SET is_read = TRUE, read_at = NOW()
          WHERE user_id = $1 
            AND is_read = FALSE
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du
              WHERE du.user_id = user_notifications.user_id
            )`,
          [userId]
        );
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  static async archive(userId: UUID, notificationId: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE user_notifications
          SET archived = TRUE, read_at = COALESCE(read_at, NOW())
          WHERE user_id = $1 
            AND id = $2
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du
              WHERE du.user_id = user_notifications.user_id
            )`,
          [userId, notificationId]
        );
      });
    } catch (error) {
      console.error("Error archiving notification:", error);
      throw error;
    }
  }

  static async archiveAll(userId: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE user_notifications
          SET archived = TRUE, read_at = COALESCE(read_at, NOW())
          WHERE user_id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du
              WHERE du.user_id = user_notifications.user_id
            )`,
          [userId]
        );
      });
    } catch (error) {
      console.error("Error archiving all notifications:", error);
      throw error;
    }
  }

  static async hasUnreadNotifications(userId: UUID): Promise<boolean> {
    try {
      const result = await query(
        `SELECT EXISTS (
          SELECT 1 FROM user_notifications
          WHERE user_id = $1 
            AND is_read = FALSE 
            AND archived = FALSE
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du
              WHERE du.user_id = user_notifications.user_id
            )
        ) AS has_unread`,
        [userId]
      );
      return result[0]?.has_unread ?? false;
    } catch (error) {
      console.error("Error checking for unread notifications:", error);
      throw error;
    }
  }
}
