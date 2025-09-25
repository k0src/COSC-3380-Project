import type { UUID } from "@types";
import { SongRepository as Song } from "@repositories";
import { AlbumRepository as Album } from "@repositories";
import { PlaylistRepository as Playlist } from "@repositories";
import { ArtistRepository as Artist } from "@repositories";
import { query } from "../config/database.js";
import { validateUserId, validateMany } from "@validators";

type Entity = "song" | "album" | "playlist" | "artist";

const HISTORY_TABLES: Record<Entity, string> = {
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
   * Gets the song history for a user.
   * @param userId - The ID of the user.
   * @param options - Optional pagination options.
   * @param options.limit - Maximum number of records to return.
   * @param options.offset - Number of records to skip.
   * @returns An array of songs and the time they were played.
   * @throws Error if the operation fails
   */
  static async getSongHistory(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Array<{ song: Song; played_at: string }>> {
    try {
      if (!(await validateUserId(userId))) {
        throw new Error("Invalid user ID");
      }

      const res = await query(
        `SELECT s.*, sh.played_at FROM songs s
        JOIN song_history sh ON s.id = sh.song_id
        WHERE sh.user_id = $1
        ORDER BY sh.played_at DESC
        ${options?.limit ? "LIMIT $2" : ""}
        ${options?.offset ? "OFFSET $3" : ""}`,
        [userId, options?.limit, options?.offset]
      );

      if (!res || res.length === 0) {
        return [];
      }

      const history: Array<{ song: Song; played_at: string }> = res.map(
        (row) => {
          const { played_at, ...songData } = row;
          return { song: songData as Song, played_at };
        }
      );

      return history;
    } catch (error) {
      console.error("Error getting song history:", error);
      throw error;
    }
  }

  /**
   * Gets the album history for a user.
   * @param userId - The ID of the user.
   * @returns An array of albums and the time they were played.
   * @throws Error if the operation fails
   */
  static async getAlbumHistory(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Array<{ album: Album; played_at: string }>> {
    try {
      if (!(await validateUserId(userId))) {
        throw new Error("Invalid user ID");
      }

      const res = await query(
        `
        SELECT a.*, ah.played_at FROM albums a
        JOIN album_history ah ON a.id = ah.album_id
        WHERE ah.user_id = $1
        ORDER BY ah.played_at DESC
        ${options?.limit ? "LIMIT $2" : ""}
        ${options?.offset ? "OFFSET $3" : ""}`,
        [userId, options?.limit, options?.offset]
      );

      if (!res || res.length === 0) {
        return [];
      }

      const history: Array<{ album: Album; played_at: string }> = res.map(
        (row) => {
          const { played_at, ...albumData } = row;
          return { album: albumData as Album, played_at };
        }
      );

      return history;
    } catch (error) {
      console.error("Error getting album history:", error);
      throw error;
    }
  }

  /**
   * Gets the playlist history for a user.
   * @param userId - The ID of the user.
   * @returns An array of playlists and the time they were played.
   * @throws Error if the operation fails
   */
  static async getPlaylistHistory(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Array<{ playlist: Playlist; played_at: string }>> {
    try {
      if (!(await validateUserId(userId))) {
        throw new Error("Invalid user ID");
      }

      const res = await query(
        `
        SELECT p.*, ph.played_at FROM playlists p
        JOIN playlist_history ph ON p.id = ph.playlist_id
        WHERE ph.user_id = $1
        ORDER BY ph.played_at DESC
        ${options?.limit ? "LIMIT $2" : ""}
        ${options?.offset ? "OFFSET $3" : ""}`,
        [userId, options?.limit, options?.offset]
      );

      if (!res || res.length === 0) {
        return [];
      }

      const history: Array<{ playlist: Playlist; played_at: string }> = res.map(
        (row) => {
          const { played_at, ...playlistData } = row;
          return { playlist: playlistData as Playlist, played_at };
        }
      );

      return history;
    } catch (error) {
      console.error("Error getting playlist history:", error);
      throw error;
    }
  }

  /**
   * Gets the artist history for a user.
   * @param userId - The ID of the user.
   * @returns An array of artists and the time they were played.
   * @throws Error if the operation fails
   */
  static async getArtistHistory(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Array<{ artist: Artist; played_at: string }>> {
    try {
      if (!(await validateUserId(userId))) {
        throw new Error("Invalid user ID");
      }

      const res = await query(
        `
        SELECT a.*, ah.played_at FROM artists a
        JOIN artist_history ah ON a.id = ah.artist_id
        WHERE ah.user_id = $1
        ORDER BY ah.played_at DESC
        ${options?.limit ? "LIMIT $2" : ""}
        ${options?.offset ? "OFFSET $3" : ""}`,
        [userId, options?.limit, options?.offset]
      );

      if (!res || res.length === 0) {
        return [];
      }

      const history: Array<{ artist: Artist; played_at: string }> = res.map(
        (row) => {
          const { played_at, ...artistData } = row;
          return { artist: artistData as Artist, played_at };
        }
      );

      return history;
    } catch (error) {
      console.error("Error getting artist history:", error);
      throw error;
    }
  }

  /**
   * Clears the history for a user.
   * @param userId - The ID of the user.
   * @throws Error if the operation fails
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
   * @throws Error if the operation fails or if the entity type is invalid.
   */
  static async addToHistory(
    userId: UUID,
    entityId: UUID,
    entity: Entity
  ): Promise<void> {
    try {
      if (
        !(await validateMany([
          { id: userId, type: "user" },
          { id: entityId, type: entity },
        ]))
      ) {
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
        return;
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
