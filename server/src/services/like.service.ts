import type { UUID, Song, Album, Playlist, User, Comment } from "@types";
import { query } from "@config/database.js";

type LikeableEntity = "song" | "album" | "playlist" | "comment";

type LikeableEntitiesMap = {
  song: Song;
  album: Album;
  playlist: Playlist;
  comment: Comment;
};

const LIKE_FUNCTIONS: Record<LikeableEntity, string> = {
  song: "toggle_song_like",
  album: "toggle_album_like",
  playlist: "toggle_playlist_like",
  comment: "toggle_comment_like",
};

const LIKE_TABLES: Record<LikeableEntity, string> = {
  song: "song_likes",
  album: "album_likes",
  playlist: "playlist_likes",
  comment: "comment_likes",
};

const LIKEABLE_ENTITY_TABLES: Record<LikeableEntity, string> = {
  song: "songs",
  album: "albums",
  playlist: "playlists",
  comment: "comments",
};

/**
 * Service for managing likes on songs, albums, playlists, and comments.
 */
export default class LikeService {
  /**
   * Toggles a like for a given entity (song, album, playlist, comment) by a user.
   * @param userId - The ID of the user.
   * @param entityId - The ID of the entity to like/unlike.
   * @param entity - The type of entity (song, album, playlist, comment).
   * @return A string indicating the action ("liked"/"unliked").
   * @throws Error if the operation fails.
   */
  static async toggleLike(
    userId: UUID,
    entityId: UUID,
    entity: LikeableEntity
  ): Promise<string> {
    try {
      const fn = LIKE_FUNCTIONS[entity];
      if (!fn) {
        throw new Error("Invalid entity type");
      }

      // Use PG RPC function to toggle like and return action
      // action is either "liked" or "unliked"
      // Atomic and thread safe
      const res = await query(`SELECT action FROM ${fn}($1, $2)`, [
        userId,
        entityId,
      ]);
      return res[0]?.action ?? null;
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }

  /**
   * Get the number of likes for an entity.
   * @param entityId - The ID of the entity.
   * @param entity - The type of entity (song, album, playlist, comment).
   * @return The number of likes.
   * @throws Error if the operation fails.
   */
  static async getLikeCount(
    entityId: UUID,
    entity: LikeableEntity
  ): Promise<number> {
    try {
      const table = LIKE_TABLES[entity];
      if (!table) {
        throw new Error("Invalid entity type");
      }

      const res = await query(
        `SELECT COUNT(*) FROM ${table} WHERE ${entity}_id = $1`,
        [entityId]
      );
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error getting like count:", error);
      throw error;
    }
  }

  /**
   * Get all entities liked by a user.
   * @param userId - The ID of the user.
   * @param entity - The type of entity (song, album, playlist, comment).
   * @return An array of entities liked by the user.
   * @throws Error if the operation fails.
   */
  static async getLikedByUser<K extends keyof LikeableEntitiesMap>(
    userId: UUID,
    entity: K
  ): Promise<LikeableEntitiesMap[K][]> {
    const table = LIKEABLE_ENTITY_TABLES[entity];
    const likeTable = LIKE_TABLES[entity];

    const res = await query(
      `SELECT e.* FROM ${table} e
     JOIN ${likeTable} l ON e.id = l.${entity}_id
     WHERE l.user_id = $1`,
      [userId]
    );

    return res as LikeableEntitiesMap[K][];
  }

  /**
   * Get all users who liked an entity.
   * @param entityId - The ID of the entity.
   * @param entity - The type of entity (song, album, playlist, comment).
   * @param options - Optional parameters for pagination.
   * @param options.limit - The maximum number of users to return.
   * @param options.offset - The number of users to skip.
   * @return An array of users who liked the entity.
   * @throws Error if the operation fails.
   */
  static async getUsersWhoLiked<K extends keyof LikeableEntitiesMap>(
    entityId: UUID,
    entity: K,
    options?: { limit?: number; offset?: number }
  ): Promise<User[]> {
    const likeTable = LIKE_TABLES[entity];
    if (!likeTable) {
      throw new Error("Invalid entity type");
    }

    const params = [entityId, options?.limit || 50, options?.offset || 0];
    const sql = `
      SELECT u.* FROM users u
      JOIN ${likeTable} l ON u.id = l.user_id
      WHERE l.${entity}_id = $1
      LIMIT $2 OFFSET $3
    `;

    const res = await query(sql, params);
    return res as User[];
  }

  /**
   * Checks if a user has liked an entity.
   * @param userId - The ID of the user.
   * @param entityId - The ID of the entity.
   * @param entity - The type of entity (song, album, playlist, comment).
   * @return Boolean indicating whether the user has liked the entity.
   * @throws Error if the operation fails.
   */
  static async hasUserLiked<K extends keyof LikeableEntitiesMap>(
    userId: UUID,
    entityId: UUID,
    entity: K
  ): Promise<boolean> {
    try {
      const table = LIKE_TABLES[entity];
      if (!table) {
        throw new Error("Invalid entity type");
      }

      const res = await query(
        `SELECT 1 FROM ${table} 
        WHERE user_id = $1 AND ${entity}_id = $2`,
        [userId, entityId]
      );
      return res.length > 0;
    } catch (error) {
      console.error("Error checking like status:", error);
      throw error;
    }
  }
}
