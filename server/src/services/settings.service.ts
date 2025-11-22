import { query, withTransaction } from "@config/database";
import type { UUID, UserSettings } from "@types";

export default class UserSettingsService {
  static async getSettings(userId: UUID): Promise<UserSettings | null> {
    try {
      const result = await query(
        "SELECT * FROM user_settings WHERE user_id = $1",
        [userId]
      );

      return result[0] ?? null;
    } catch (error) {
      console.error("Error fetching user settings:", error);
      throw error;
    }
  }

  static async updateSettings(
    userId: UUID,
    {
      release_notifications,
      playlist_like_notifications,
      follower_notifications,
      comment_tag_notifications,
      color_scheme,
      color_theme,
      zoom_level,
      artist_like_notifications,
      song_comment_notifications,
      songs_discoverable,
    }: Partial<UserSettings>
  ): Promise<UserSettings | null> {
    try {
      const result = await withTransaction(async (client) => {
        const fields: string[] = [];
        const values: any[] = [];

        if (release_notifications !== undefined) {
          fields.push(`release_notifications = $${values.length + 1}`);
          values.push(release_notifications);
        }
        if (playlist_like_notifications !== undefined) {
          fields.push(`playlist_like_notifications = $${values.length + 1}`);
          values.push(playlist_like_notifications);
        }
        if (follower_notifications !== undefined) {
          fields.push(`follower_notifications = $${values.length + 1}`);
          values.push(follower_notifications);
        }
        if (comment_tag_notifications !== undefined) {
          fields.push(`comment_tag_notifications = $${values.length + 1}`);
          values.push(comment_tag_notifications);
        }
        if (color_scheme !== undefined) {
          fields.push(`color_scheme = $${values.length + 1}`);
          values.push(color_scheme);
        }
        if (color_theme !== undefined) {
          fields.push(`color_theme = $${values.length + 1}`);
          values.push(color_theme);
        }
        if (zoom_level !== undefined) {
          fields.push(`zoom_level = $${values.length + 1}`);
          values.push(zoom_level);
        }
        if (artist_like_notifications !== undefined) {
          fields.push(`artist_like_notifications = $${values.length + 1}`);
          values.push(artist_like_notifications);
        }
        if (song_comment_notifications !== undefined) {
          fields.push(`song_comment_notifications = $${values.length + 1}`);
          values.push(song_comment_notifications);
        }
        if (songs_discoverable !== undefined) {
          fields.push(`songs_discoverable = $${values.length + 1}`);
          values.push(songs_discoverable);
        }
        if (fields.length === 0) {
          throw new Error("No fields provided to update.");
        }

        values.push(userId);

        const sql = `UPDATE user_settings SET ${fields.join(
          ", "
        )}, updated_at = NOW() WHERE user_id = $${values.length} RETURNING *`;
        const res = await client.query(sql, values);
        return res.rows[0] ?? null;
      });

      return result;
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  }
}
