import type { UUID, Song, Album, Playlist, Artist } from "@types";
import { query } from "../config/database.js";
import { validateUserId, validateMany } from "@validators";

type HistoryEntity = "song" | "album" | "playlist" | "artist";

type HistoryEntityMap = {
  song: Song;
  album: Album;
  playlist: Playlist;
  artist: Artist;
};

const HISTORY_TABLES: Record<HistoryEntity, string> = {
  song: "song_history",
  album: "album_history",
  playlist: "playlist_history",
  artist: "artist_history",
};

/**
 * Service for managing user song, album, playlist, and artist history.
 */
export default class HistoryService {
  /**
   * Fetches the history of a user for an entity.
   * @param userId - The ID of the user.
   * @param entity - The type of entity (song, album, playlist, artist).
   * @param options - Optional parameters for pagination.
   * @return An array of entities from the user's history.
   * @throws Error if the operation fails.
   */
  static async getHistory<K extends keyof HistoryEntityMap>(
    userId: UUID,
    entity: K,
    options?: { limit?: number; offset?: number }
  ): Promise<HistoryEntityMap[K][]> {
    try {
      if (!(await validateUserId(userId))) {
        throw new Error("Invalid user ID");
      }

      const table = HISTORY_TABLES[entity];
      if (!table) {
        throw new Error("Invalid entity type");
      }

      const params = [userId, options?.limit || 50, options?.offset || 0];
      const sql = `
        SELECT e.* FROM ${table} h
        JOIN ${entity}s e ON h.${entity}_id = e.id
        WHERE h.user_id = $1
        ORDER BY h.played_at DESC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, params);
      return res as HistoryEntityMap[K][];
    } catch (error) {
      console.error("Error fetching history:", error);
      throw error;
    }
  }

  /**
   * Clears the history for a user.
   * @param userId - The ID of the user.
   * @throws Error if the operation fails.
   */
  static async clearHistory(userId: UUID): Promise<void> {
    try {
      if (!(await validateUserId(userId))) {
        throw new Error("Invalid user ID");
      }

      await query("DELETE FROM song_history WHERE user_id = $1", [userId]);
      await query("DELETE FROM album_history WHERE user_id = $1", [userId]);
      await query("DELETE FROM playlist_history WHERE user_id = $1", [userId]);
      await query("DELETE FROM artist_history WHERE user_id = $1", [userId]);
    } catch (error) {
      console.error("Error clearing history:", error);
      throw error;
    }
  }

  /**
   * Adds an entity to the user's history.
   * @param userId - The ID of the user.
   * @param entityId - The ID of the entity to add to history.
   * @param entity - The type of entity (song, album, playlist, artist).
   * @throws Error if the operation fails. or if the entity type is invalid.
   */
  static async addToHistory<K extends keyof HistoryEntityMap>(
    userId: UUID,
    entityId: UUID,
    entity: K
  ) {
    try {
      const valid = await validateMany([
        { id: userId, type: "user" },
        { id: entityId, type: entity },
      ]);
      if (!valid) {
        throw new Error("Invalid user ID or entity ID");
      }

      const table = HISTORY_TABLES[entity];
      if (!table) {
        throw new Error("Invalid entity type");
      }

      // Check for duplicate entry before inserting
      const checkQuery = `SELECT 1 FROM ${table} WHERE user_id = $1 AND ${entity}_id = $2`;
      const exists = await query(checkQuery, [userId, entityId]);

      if (exists && exists.length > 0) {
        return; // already in history
      }

      await query(
        `INSERT INTO ${table} (user_id, ${entity}_id) VALUES ($1, $2)`,
        [userId, entityId]
      );
    } catch (error) {
      console.error("Error adding to history:", error);
      throw error;
    }
  }
}
