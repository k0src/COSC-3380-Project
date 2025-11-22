import { query } from "config/database.js";
import type { UUID } from "types";

export type AppealEntity = "user" | "song" | "album" | "playlist";

export interface AdminAppealData {
  appeal_id?: UUID; // Only for user appeals
  user_id: UUID;
  entity_id?: UUID; // song_id, album_id, playlist_id (not for user appeals)
  submitted_at: string;
  report_type: string;
  reason: string;
  appeal_status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  reviewer_id?: UUID | null;

  // Additional fields for display
  username?: string;
  entity_name?: string; // song title, album title, playlist name
  entity_owner?: string; // for content appeals
}

export default class AdminAppealsRepository {
  static async getAppeals(
    entity: AppealEntity,
    limit = 50,
    offset = 0
  ): Promise<AdminAppealData[]> {
    try {
      let sql: string;
      let params: any[];

      if (entity === "user") {
        // User appeals table has appeal_id
        sql = `
          SELECT 
            ua.appeal_id,
            ua.user_id,
            ua.submitted_at,
            ua.report_type,
            ua.reason,
            ua.appeal_status,
            ua.reviewer_id,
            u.username
          FROM user_appeals ua
          LEFT JOIN users u ON ua.user_id = u.id
          WHERE ua.appeal_status = 'PENDING_REVIEW'
          ORDER BY ua.submitted_at DESC
          LIMIT $1 OFFSET $2;
        `;
        params = [limit, offset];
      } else {
        // Content appeals tables use composite keys
        const appealTable = `${entity}_appeals`;

        if (entity === "song") {
          // Songs don't have a direct owner, they're linked to artists via song_artists
          sql = `
            SELECT 
              a.user_id,
              a.song_id as entity_id,
              a.submitted_at,
              a.report_type,
              a.reason,
              a.appeal_status,
              a.reviewer_id,
              u.username,
              s.title as entity_name,
              artist_user.username as entity_owner
            FROM ${appealTable} a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN songs s ON a.song_id = s.id
            LEFT JOIN song_artists sa ON s.id = sa.song_id AND sa.role = 'primary'
            LEFT JOIN artists ar ON sa.artist_id = ar.id
            LEFT JOIN users artist_user ON artist_user.artist_id = ar.id
            WHERE a.appeal_status = 'PENDING_REVIEW'
            ORDER BY a.submitted_at DESC
            LIMIT $1 OFFSET $2;
          `;
        } else if (entity === "album") {
          // Albums have created_by column
          sql = `
            SELECT 
              a.user_id,
              a.album_id as entity_id,
              a.submitted_at,
              a.report_type,
              a.reason,
              a.appeal_status,
              a.reviewer_id,
              u.username,
              alb.title as entity_name,
              artist_user.username as entity_owner
            FROM ${appealTable} a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN albums alb ON a.album_id = alb.id
            LEFT JOIN artists ar ON alb.created_by = ar.id
            LEFT JOIN users artist_user ON artist_user.artist_id = ar.id
            WHERE a.appeal_status = 'PENDING_REVIEW'
            ORDER BY a.submitted_at DESC
            LIMIT $1 OFFSET $2;
          `;
        } else {
          // Playlists have created_by column (user id)
          sql = `
            SELECT 
              a.user_id,
              a.playlist_id as entity_id,
              a.submitted_at,
              a.report_type,
              a.reason,
              a.appeal_status,
              a.reviewer_id,
              u.username,
              p.title as entity_name,
              owner.username as entity_owner
            FROM ${appealTable} a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN playlists p ON a.playlist_id = p.id
            LEFT JOIN users owner ON p.created_by = owner.id
            WHERE a.appeal_status = 'PENDING_REVIEW'
            ORDER BY a.submitted_at DESC
            LIMIT $1 OFFSET $2;
          `;
        }

        params = [limit, offset];
      }

      const result = await query(sql, params);
      return Array.isArray(result) ? result : result ? [result] : [];
    } catch (error) {
      console.error(`Error fetching ${entity} appeals:`, error);
      throw error;
    }
  }

  static async updateAppealDecision(
    entity: AppealEntity,
    appealData: {
      appealId?: UUID;
      userId: UUID;
      entityId?: UUID;
      submittedAt: string;
      action: "approve" | "reject";
      reviewerId: UUID;
    }
  ) {
    try {
      const status = appealData.action === "approve" ? "APPROVED" : "REJECTED";
      let sql: string;
      let params: any[];

      if (entity === "user") {
        // User appeals use appeal_id as primary key
        sql = `
          UPDATE user_appeals
          SET appeal_status = $1, reviewer_id = $2
          WHERE appeal_id = $3 AND user_id = $4 AND submitted_at = $5
          RETURNING *;
        `;
        params = [
          status,
          appealData.reviewerId,
          appealData.appealId,
          appealData.userId,
          appealData.submittedAt,
        ];
      } else {
        // Content appeals use composite keys
        const entityIdColumn =
          entity === "song"
            ? "song_id"
            : entity === "album"
            ? "album_id"
            : "playlist_id";
        const appealTable = `${entity}_appeals`;

        sql = `
          UPDATE ${appealTable}
          SET appeal_status = $1, reviewer_id = $2
          WHERE user_id = $3 AND ${entityIdColumn} = $4 AND submitted_at = $5
          RETURNING *;
        `;
        params = [
          status,
          appealData.reviewerId,
          appealData.userId,
          appealData.entityId,
          appealData.submittedAt,
        ];
      }

      const result = await query(sql, params);
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error(`Error updating ${entity} appeal decision:`, error);
      throw error;
    }
  }
}
