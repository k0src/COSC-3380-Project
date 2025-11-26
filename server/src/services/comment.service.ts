import type {
  UUID,
  Comment,
  CommentOrderByColumn,
  OrderByDirection,
  AccessContext,
} from "@types";
import {
  notDeletedCondition,
  getVisibilityCondition,
  getUserVisibilityCondition,
  isDeleted,
} from "@util";
import { query, withTransaction } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { PoolClient } from "pg";

export default class CommentService {
  static async getCommentsBySongId(
    songId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: CommentOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Comment[]> {
    try {
      const songVisibility = getVisibilityCondition(
        "s",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "commented_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<CommentOrderByColumn, string> = {
        likes: "likes",
        commented_at: "c.commented_at",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          c.*,
          s.title AS song_title,
          u.username,
          u.profile_picture_url,
          u.pfp_blurhash,
          COALESCE(COUNT(cl.comment_id), 0) AS likes
        FROM comments c
        JOIN songs s ON c.song_id = s.id
        JOIN users u ON c.user_id = u.id
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id
        WHERE c.song_id = $1
          AND ${notDeletedCondition("comment", "c")}
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
          AND ${songVisibility}
          AND ${userVisibility}
        GROUP BY
          c.id, 
          c.song_id, 
          c.user_id, 
          c.comment_text, 
          c.commented_at, 
          s.title, 
          u.username, 
          u.profile_picture_url, 
          u.pfp_blurhash
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const comments = await query(sql, [songId, limit, offset]);
      if (comments.length === 0) {
        return [];
      }

      const commentIds = comments.map((c) => c.id);
      const mentionsSql = `
        SELECT 
          cm.comment_id, 
          cm.user_id, 
          cm.start_pos AS start, 
          cm.end_pos AS end, 
          u.username
        FROM comment_mentions cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.comment_id = ANY($1)
          AND ${notDeletedCondition("user", "u")}
      `;

      const mentions = await query(mentionsSql, [commentIds]);
      const commentTags = new Map<UUID, any[]>();
      for (const m of mentions) {
        if (!commentTags.has(m.comment_id)) {
          commentTags.set(m.comment_id, []);
        }
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

  static async getCommentsByArtistId(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: CommentOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Comment[]> {
    try {
      const songVisibility = getVisibilityCondition(
        "s",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "commented_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<CommentOrderByColumn, string> = {
        likes: "likes",
        commented_at: "c.commented_at",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          c.*,
          s.title AS song_title,
          u.username,
          u.profile_picture_url,
          u.pfp_blurhash,
          COALESCE(COUNT(cl.comment_id), 0) AS likes
        FROM comments c
        JOIN songs s ON c.song_id = s.id
        JOIN song_artists sa ON sa.song_id = s.id
        JOIN artists a ON sa.artist_id = a.id
        JOIN users u ON c.user_id = u.id
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id
        WHERE sa.artist_id = $1
          AND ${notDeletedCondition("comment", "c")}
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("artist", "a")}
          AND ${notDeletedCondition("user", "u")}
          AND ${songVisibility}
          AND ${userVisibility}
        GROUP BY 
          c.id, 
          c.song_id, 
          c.user_id, 
          c.comment_text, 
          c.commented_at, 
          s.title, 
          u.username, 
          u.profile_picture_url, 
          u.pfp_blurhash
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const comments = await query(sql, [artistId, limit, offset]);
      for (const comment of comments) {
        if (comment.profile_picture_url) {
          comment.profile_picture_url = getBlobUrl(comment.profile_picture_url);
        }
      }

      return comments;
    } catch (error) {
      console.error("Error fetching artist comments:", error);
      throw error;
    }
  }

  static async addComment(userId: UUID, songId: UUID, commentText: string) {
    try {
      const songDeleted = await isDeleted(songId, "song");
      if (songDeleted) {
        throw new Error("Cannot comment on a deleted song.");
      }

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
      `SELECT id, username FROM users 
       WHERE username = ANY($1) 
       AND is_private = FALSE
       AND NOT EXISTS (
        SELECT 1 FROM deleted_users du WHERE du.user_id = users.id
      )`,
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

  static async deleteComment(commentId: UUID) {
    try {
      await query(
        `INSERT INTO deleted_comments
        (comment_id, deleted_at)
        VALUES ($1, NOW())`,
        [commentId]
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }

  static async bulkDeleteComments(commentIds: UUID[]) {
    try {
      await query(
        `INSERT INTO deleted_comments
        (comment_id, deleted_at)
        SELECT id, NOW() FROM comments WHERE id = ANY($1)`,
        [commentIds]
      );
    } catch (error) {
      console.error("Error bulk deleting comments:", error);
      throw error;
    }
  }

  static async clearComments(songId: UUID) {
    try {
      await query(
        `INSERT INTO deleted_comments (comment_id, deleted_at)
         SELECT id, NOW() FROM comments WHERE song_id = $1`,
        [songId]
      );
    } catch (error) {
      console.error("Error clearing comments:", error);
      throw error;
    }
  }
}
