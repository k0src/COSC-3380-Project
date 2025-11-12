import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const {
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGPOOLSIZE,
  PGSSLMODE,
} = process.env;

if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE) {
  throw new Error("Missing required Postgres environment variables.");
}

const pool = new Pool({
  host: PGHOST,
  port: PGPORT ? parseInt(PGPORT, 10) : 5432,
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
  max: PGPOOLSIZE ? parseInt(PGPOOLSIZE, 10) : undefined,
  ssl: {
    rejectUnauthorized: false,
  },
});

export interface UserSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export class UserSettingsRepository {
  /**
   * Get settings for a user, or create default settings if they don't exist
   */
  static async getOrCreate(userId: string): Promise<UserSettings> {
    try {
      const result = await pool.query(
        `SELECT * FROM user_settings WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Create default settings if they don't exist
      const newSettings = await pool.query(
        `INSERT INTO user_settings (user_id, notifications_enabled, is_private)
         VALUES ($1, true, false)
         RETURNING *`,
        [userId]
      );

      return newSettings.rows[0];
    } catch (error) {
      console.error("Error getting or creating user settings:", error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  static async update(
    userId: string,
    settings: Partial<Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at">>
  ): Promise<UserSettings> {
    try {
      const updates: string[] = [];
      const values: any[] = [userId];
      let paramIndex = 2;

      if (settings.notifications_enabled !== undefined) {
        updates.push(`notifications_enabled = $${paramIndex++}`);
        values.push(settings.notifications_enabled);
      }

      if (settings.is_private !== undefined) {
        updates.push(`is_private = $${paramIndex++}`);
        values.push(settings.is_private);
      }

      if (updates.length === 0) {
        // No updates, just return current settings
        return this.getOrCreate(userId);
      }

      updates.push(`updated_at = NOW()`);

      const query = `
        UPDATE user_settings
        SET ${updates.join(", ")}
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        // Settings don't exist, create them with the new values
        return this.getOrCreate(userId);
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  }

  /**
   * Get all settings (admin only)
   */
  static async getAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ settings: UserSettings[]; total: number }> {
    try {
      const countResult = await pool.query(`SELECT COUNT(*) FROM user_settings`);
      const total = parseInt(countResult.rows[0].count, 10);

      const result = await pool.query(
        `SELECT * FROM user_settings ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return { settings: result.rows, total };
    } catch (error) {
      console.error("Error getting all user settings:", error);
      throw error;
    }
  }

  /**
   * Delete settings for a user
   */
  static async delete(userId: string): Promise<void> {
    try {
      await pool.query(`DELETE FROM user_settings WHERE user_id = $1`, [userId]);
    } catch (error) {
      console.error("Error deleting user settings:", error);
      throw error;
    }
  }
}
