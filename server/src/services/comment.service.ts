import type { UUID, Comment } from "@types";
import { query } from "../config/database.js";
import {
  validateUserId,
  validateSongId,
  validateMany,
  validateCommentId,
} from "../validators/id.validator.js";

/**
 * Service for managing song comments.
 */
export default class CommentService {
  /**
   * Adds a comment to a song by a user.
   * @param userId The ID of the user making the comment.
   * @param songId The ID of the song being commented on.
   * @param commentText The text of the comment.
   * @throws Error if the operation fails.
   */
  static async addComment(userId: UUID, songId: UUID, commentText: string) {
    const valid = await validateMany([
      { id: userId, type: "user" },
      { id: songId, type: "song" },
    ]);
    if (!valid) {
      throw new Error("Invalid user ID or song ID");
    }

    try {
      await query(
        `INSERT INTO comments (user_id, song_id, comment_text) 
        VALUES ($1, $2, $3)`,
        [userId, songId, commentText]
      );
    } catch (error) {
      throw new Error("Error adding comment");
    }
  }

  /**
   * Deletes a comment by its ID.
   * @param commentId The ID of the comment to delete.
   * @throws Error if the operation fails.
   */
  static async deleteComment(commentId: UUID) {
    if (!(await validateCommentId(commentId))) {
      throw new Error("Invalid comment ID");
    }

    try {
      await query("DELETE FROM comments WHERE id = $1", [commentId]);
    } catch (error) {
      throw new Error("Error deleting comment");
    }
  }

  /**
   * Clears all comments for a specific song.
   * @param songId The ID of the song whose comments are to be cleared.
   * @throws Error if the operation fails.
   */
  static async clearComments(songId: UUID) {
    try {
      if (!(await validateSongId(songId))) {
        throw new Error("Invalid song ID");
      }

      await query("DELETE FROM comments WHERE song_id = $1", [songId]);
    } catch (error) {
      throw new Error("Error clearing comments");
    }
  }

  /**
   * Fetches all comments for a specific song, including user details.
   * @param songId The ID of the song whose comments are to be fetched.
   * @param options Optional pagination options.
   * @param options.limit Maximum number of comments to return.
   * @param options.offset Number of comments to skip.
   * @returns An array of comments with user details.
   * @throws Error if the operation fails.
   */
  static async getCommentsBySongId(
    songId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Comment[]> {
    try {
      if (!(await validateSongId(songId))) {
        throw new Error("Invalid song ID");
      }

      const params = [songId, options?.limit || 50, options?.offset || 0];
      const sql = `
        SELECT c.*, u.username, u.id, u.profile_picture_url
        FROM comments c 
        JOIN users u ON c.user_id = u.id
        WHERE c.song_id = $1
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, params);
      return res;
    } catch (error) {
      throw new Error("Error fetching comments");
    }
  }

  /**
   * Fetches all comments made by a specific user, including user details.
   * @param userId The ID of the user whose comments are to be fetched.
   * @param options Optional pagination options.
   * @param options.limit Maximum number of comments to return.
   * @param options.offset Number of comments to skip.
   * @returns An array of comments with user details.
   * @throws Error if the operation fails.
   */
  static async getCommentsByUserId(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Comment[]> {
    try {
      if (!(await validateUserId(userId))) {
        throw new Error("Invalid user ID");
      }

      const params = [userId, options?.limit || 50, options?.offset || 0];
      const sql = `
        SELECT c.*, u.username, u.id, u.profile_picture_url
        FROM comments c 
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, params);
      return res;
    } catch (error) {
      throw new Error("Error fetching comments");
    }
  }
}
