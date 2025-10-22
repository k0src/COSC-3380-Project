import type { UUID, Comment } from "@types";
import { query, withTransaction } from "../config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { PoolClient } from "pg";

/**
 * Service for managing song comments.
 */
export default class CommentService {
  /**
   * Adds a new comment to a song.
   * @param userId The ID of the user making the comment.
   * @param songId The ID of the song being commented on.
   * @param commentText The text of the comment.
   * @returns The ID of the newly created comment.
   * @throws Error if the operation fails.
   */
  static async addComment(userId: UUID, songId: UUID, commentText: string) {
    try {
      return await withTransaction(async (client) => {
        const insertSql = `
          INSERT INTO comments (user_id, song_id, comment_text) 
          VALUES ($1, $2, $3)
          RETURNING id`;

        const inserted = await client.query(insertSql, [
          userId,
          songId,
          commentText,
        ]);
        const commentId = inserted.rows[0].id as UUID;
        await CommentService.parseAndInsertMentions(
          client,
          commentId,
          commentText
        );
        return commentId;
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  /**
   * Parses mentions in the comment text and inserts them into the database.
   * @param client The database client.
   * @param commentId The ID of the comment.
   * @param commentText The text of the comment.
   * @throws Error if the operation fails.
   */
  private static async parseAndInsertMentions(
    client: PoolClient,
    commentId: UUID,
    commentText: string
  ) {
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const matches = Array.from(commentText.matchAll(mentionRegex));

    if (matches.length === 0) return;

    const usernames = matches.map((match) => match[1]);

    const users = await query(
      "SELECT id, username FROM users WHERE username = ANY($1)",
      [usernames]
    );

    if (users.length === 0) return;

    const mentions = [];
    for (const user of users) {
      for (const match of matches) {
        if (match[1] === user.username) {
          const start = match.index ?? 0;
          const end = start + match[0].length;
          mentions.push([commentId, user.id, start, end]);
        }
      }
    }

    if (mentions.length === 0) return;

    const values = mentions
      .map(
        (_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
      )
      .join(", ");

    const params = mentions.flat();
    const insertMentionsSql = `
      INSERT INTO comment_mentions (comment_id, user_id, start_pos, end_pos)
      VALUES ${values}
    `;
    await client.query(insertMentionsSql, params);
  }

  /**
   * Deletes a comment by its ID.
   * @param commentId The ID of the comment to delete.
   * @throws Error if the operation fails.
   */
  static async deleteComment(commentId: UUID) {
    try {
      await query("DELETE FROM comments WHERE id = $1", [commentId]);
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }

  /**
   * Clears all comments for a specific song.
   * @param songId The ID of the song whose comments are to be cleared.
   * @throws Error if the operation fails.
   */
  static async clearComments(songId: UUID) {
    try {
      await query("DELETE FROM comments WHERE song_id = $1", [songId]);
    } catch (error) {
      console.error("Error clearing comments:", error);
      throw error;
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
    options?: {
      includeLikes?: boolean;
      currentUserId?: UUID;
      limit?: number;
      offset?: number;
    }
  ): Promise<Comment[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const sql = `
        SELECT c.*, u.username, u.id AS user_id, u.profile_picture_url,
          CASE WHEN $2 THEN (
            SELECT COUNT(*) 
            FROM comment_likes cl WHERE cl.comment_id = c.id
          ) ELSE NULL END AS likes,
          CASE WHEN $2 AND $3::UUID IS NOT NULL THEN (  
            SELECT EXISTS (
              SELECT 1
              FROM comment_likes cl2
              WHERE cl2.comment_id = c.id AND cl2.user_id = $3::UUID
            )
          ) ELSE NULL END AS user_liked
        FROM comments c 
        JOIN users u ON c.user_id = u.id
        WHERE c.song_id = $1
        ORDER BY c.commented_at DESC
        LIMIT $4 OFFSET $5`;

      const params = [
        songId,
        options?.includeLikes ?? false,
        options?.currentUserId ?? null,
        limit,
        offset,
      ];

      const comments = await query(sql, params);
      if (comments.length === 0) return [];

      const commentIds = comments.map((c) => c.id);
      const mentionsSql = `
        SELECT cm.comment_id, cm.user_id, cm.start_pos AS start, cm.end_pos AS end, u.username
        FROM comment_mentions cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.comment_id = ANY($1)`;

      const mentions = await query(mentionsSql, [commentIds]);
      const commentTags = new Map<UUID, any[]>();
      for (const m of mentions) {
        if (!commentTags.has(m.comment_id)) commentTags.set(m.comment_id, []);
        commentTags.get(m.comment_id)!.push({
          user_id: m.user_id,
          username: m.username,
          start: m.start,
          end: m.end,
        });
      }

      for (const comment of comments) {
        if (comment.profile_picture_url) {
          comment.profile_picture_url = getBlobUrl(comment.profile_picture_url);
        }
        comment.tags = commentTags.get(comment.id) || [];
      }

      return comments;
    } catch (error) {
      console.error("Error fetching comments", error);
      throw error;
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
      console.error("Error fetching comments:", error);
      throw error;
    }
  }
}
