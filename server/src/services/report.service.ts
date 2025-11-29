import type {
  UUID,
  ReportType,
  ReportableEntityType,
  ReportOrderByColumn,
  AppealOrderByColumn,
  OrderByDirection,
  Report,
  Appeal,
} from "@types";
import { query, withTransaction } from "@config/database.js";
import { isDeleted, isRemoved, notDeletedCondition } from "@util";

export default class ReportService {
  static async getReports(options?: {
    orderByColumn?: ReportOrderByColumn;
    orderByDirection?: OrderByDirection;
    limit?: number;
    offset?: number;
  }): Promise<Report[]> {
    try {
      const orderByColumn = options?.orderByColumn || "reported_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<ReportOrderByColumn, string> = {
        reported_at: "reported_at",
        report_type: "report_type",
        report_status: "report_status",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        WITH all_reports AS (
          SELECT
            sr.id,
            sr.reporter_id,
            sr.reported_id,
            sr.reported_at,
            sr.report_type,
            sr.description,
            sr.report_status,
            sr.reviewer_id,
            u1.username AS reporter_username,
            s.title AS reported_name,
            'song' AS entity_type
          FROM song_reports sr
          JOIN users u1 ON sr.reporter_id = u1.id
          JOIN songs s ON sr.reported_id = s.id
          WHERE ${notDeletedCondition("song", "s")}
            AND ${notDeletedCondition("user", "u1")}
          UNION ALL
          SELECT
            ar.id,
            ar.reporter_id,
            ar.reported_id,
            ar.reported_at,
            ar.report_type,
            ar.description,
            ar.report_status,
            ar.reviewer_id,
            u1.username AS reporter_username,
            a.title AS reported_name,
            'album' AS entity_type
          FROM album_reports ar
          JOIN users u1 ON ar.reporter_id = u1.id
          JOIN albums a ON ar.reported_id = a.id
          WHERE ${notDeletedCondition("album", "a")}
            AND ${notDeletedCondition("user", "u1")}
          UNION ALL
          SELECT
            pr.id,
            pr.reporter_id,
            pr.reported_id,
            pr.reported_at,
            pr.report_type,
            pr.description,
            pr.report_status,
            pr.reviewer_id,
            u1.username AS reporter_username,
            p.title AS reported_name,
            'playlist' AS entity_type
          FROM playlist_reports pr
          JOIN users u1 ON pr.reporter_id = u1.id
          JOIN playlists p ON pr.reported_id = p.id
          WHERE ${notDeletedCondition("playlist", "p")}
            AND ${notDeletedCondition("user", "u1")}
          UNION ALL
          SELECT
            ur.id,
            ur.reporter_id,
            ur.reported_id,
            ur.reported_at,
            ur.report_type,
            ur.description,
            ur.report_status,
            ur.reviewer_id,
            u1.username AS reporter_username,
            u2.username AS reported_name,
            'user' AS entity_type
          FROM user_reports ur
          JOIN users u1 ON ur.reporter_id = u1.id
          JOIN users u2 ON ur.reported_id = u2.id
          WHERE ${notDeletedCondition("user", "u2")}
            AND ${notDeletedCondition("user", "u1")}
        )
        SELECT * FROM all_reports
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $1 OFFSET $2
      `;

      const result = await query(sql, [limit, offset]);
      return result;
    } catch (error) {
      console.error("Error retrieving reports:", error);
      throw error;
    }
  }

  static async getAppeals(options?: {
    orderByColumn?: AppealOrderByColumn;
    orderByDirection?: OrderByDirection;
    limit?: number;
    offset?: number;
  }): Promise<Appeal[]> {
    try {
      const orderByColumn = options?.orderByColumn || "submitted_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<AppealOrderByColumn, string> = {
        submitted_at: "submitted_at",
        appeal_status: "appeal_status",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        WITH all_appeals AS (
          SELECT
            sa.id,
            sa.user_id,
            sa.song_id AS entity_id,
            sa.submitted_at,
            sa.reason,
            sa.appeal_status,
            sa.reviewer_id,
            u.username,
            s.title AS entity_name,
            'song' AS entity_type
          FROM song_appeals sa
          JOIN users u ON sa.user_id = u.id
          JOIN songs s ON sa.song_id = s.id
          WHERE ${notDeletedCondition("song", "s")}
            AND ${notDeletedCondition("user", "u")}
          UNION ALL
          SELECT
            aa.id,
            aa.user_id,
            aa.album_id AS entity_id,
            aa.submitted_at,
            aa.reason,
            aa.appeal_status,
            aa.reviewer_id,
            u.username,
            a.title AS entity_name,
            'album' AS entity_type
          FROM album_appeals aa
          JOIN users u ON aa.user_id = u.id
          JOIN albums a ON aa.album_id = a.id
          WHERE ${notDeletedCondition("album", "a")}
            AND ${notDeletedCondition("user", "u")}
          UNION ALL
          SELECT
            pa.id,
            pa.user_id,
            pa.playlist_id AS entity_id,
            pa.submitted_at,
            pa.reason,
            pa.appeal_status,
            pa.reviewer_id,
            u.username,
            p.title AS entity_name,
            'playlist' AS entity_type
          FROM playlist_appeals pa
          JOIN users u ON pa.user_id = u.id
          JOIN playlists p ON pa.playlist_id = p.id
          WHERE ${notDeletedCondition("playlist", "p")}
            AND ${notDeletedCondition("user", "u")}
          UNION ALL
          SELECT
            ua.id,
            ua.user_id,
            ua.user_id AS entity_id,
            ua.submitted_at,
            ua.reason,
            ua.appeal_status,
            ua.reviewer_id,
            u.username,
            u.username AS entity_name,
            'user' AS entity_type
          FROM user_appeals ua
          JOIN users u ON ua.user_id = u.id
          WHERE ${notDeletedCondition("user", "u")}
        )
        SELECT * FROM all_appeals
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $1 OFFSET $2
      `;

      const result = await query(sql, [limit, offset]);
      return result;
    } catch (error) {
      console.error("Error retrieving appeals:", error);
      throw error;
    }
  }
  static async reportSong(reportData: {
    reporter_id: UUID;
    reported_id: UUID;
    report_type: ReportType;
    description: string;
  }) {
    try {
      const songDeleted = await isDeleted(reportData.reported_id, "song");
      if (songDeleted) {
        throw new Error("Cannot report a deleted song.");
      }
      const songRemoved = await isRemoved(reportData.reported_id, "song");
      if (songRemoved) {
        throw new Error("Song is already removed from public access.");
      }

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO song_reports
          (reporter_id, reported_id, report_type, description, reported_at)
          VALUES ($1, $2, $3, $4, NOW())`,
          [
            reportData.reporter_id,
            reportData.reported_id,
            reportData.report_type,
            reportData.description,
          ]
        );
      });
    } catch (error) {
      console.error("Error reporting song:", error);
      throw error;
    }
  }

  static async getSongAppeals(
    songId: UUID,
    options?: {
      orderByColumn?: AppealOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Appeal[]> {
    try {
      const orderByColumn = options?.orderByColumn || "submitted_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<AppealOrderByColumn, string> = {
        submitted_at: "submitted_at",
        appeal_status: "appeal_status",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT
          sa.id,
          sa.user_id,
          sa.song_id AS entity_id,
          sa.submitted_at,
          sa.reason,
          sa.appeal_status,
          sa.reviewer_id,
          u.username,    
          s.title AS entity_name,
          'song' AS entity_type
        FROM song_appeals sa
        JOIN users u ON sa.user_id = u.id
        JOIN songs s ON sa.song_id = s.id
        WHERE sa.song_id = $1
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const result = await query(sql, [songId, limit, offset]);
      return result;
    } catch (error) {
      console.error("Error retrieving song appeals:", error);
      throw error;
    }
  }

  static async getPlaylistAppeals(
    playlistId: UUID,
    options?: {
      orderByColumn?: AppealOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Appeal[]> {
    try {
      const orderByColumn = options?.orderByColumn || "submitted_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<AppealOrderByColumn, string> = {
        submitted_at: "submitted_at",
        appeal_status: "appeal_status",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT
          pa.id,
          pa.user_id,
          pa.playlist_id AS entity_id,
          pa.submitted_at,
          pa.reason,
          pa.appeal_status,
          pa.reviewer_id,
          u.username,
          p.title AS entity_name,
          'playlist' AS entity_type
        FROM playlist_appeals pa
        JOIN users u ON pa.user_id = u.id
        JOIN playlists p ON pa.playlist_id = p.id
        WHERE pa.playlist_id = $1
          AND ${notDeletedCondition("playlist", "p")}
          AND ${notDeletedCondition("user", "u")}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const result = await query(sql, [playlistId, limit, offset]);
      return result;
    } catch (error) {
      console.error("Error retrieving playlist appeals:", error);
      throw error;
    }
  }

  static async getAlbumAppeals(
    albumId: UUID,
    options?: {
      orderByColumn?: AppealOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Appeal[]> {
    try {
      const orderByColumn = options?.orderByColumn || "submitted_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<AppealOrderByColumn, string> = {
        submitted_at: "submitted_at",
        appeal_status: "appeal_status",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT  
          aa.id,
          aa.user_id,
          aa.album_id AS entity_id,
          aa.submitted_at,
          aa.reason,
          aa.appeal_status,
          aa.reviewer_id,
          u.username,
          a.title AS entity_name,
          'album' AS entity_type
        FROM album_appeals aa
        JOIN users u ON aa.user_id = u.id
        JOIN albums a ON aa.album_id = a.id
        WHERE aa.album_id = $1
          AND ${notDeletedCondition("album", "a")}
          AND ${notDeletedCondition("user", "u")}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const result = await query(sql, [albumId, limit, offset]);
      return result;
    } catch (error) {
      console.error("Error retrieving album appeals:", error);
      throw error;
    }
  }

  static async getUserAppeals(
    userId: UUID,
    options?: {
      orderByColumn?: AppealOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Appeal[]> {
    try {
      const orderByColumn = options?.orderByColumn || "submitted_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<AppealOrderByColumn, string> = {
        submitted_at: "submitted_at",
        appeal_status: "appeal_status",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT
          ua.id,
          ua.user_id,
          ua.user_id AS entity_id,
          ua.submitted_at,
          ua.reason,
          ua.appeal_status,
          ua.reviewer_id,
          u.username,
          u.username AS entity_name,
          'user' AS entity_type
        FROM user_appeals ua
        JOIN users u ON ua.user_id = u.id
        WHERE ua.user_id = $1
          AND ${notDeletedCondition("user", "u")}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const result = await query(sql, [userId, limit, offset]);
      return result;
    } catch (error) {
      console.error("Error retrieving user appeals:", error);
      throw error;
    }
  }

  static async reportAlbum(reportData: {
    reporter_id: UUID;
    reported_id: UUID;
    report_type: ReportType;
    description: string;
  }) {
    try {
      const albumDeleted = await isDeleted(reportData.reported_id, "album");
      if (albumDeleted) {
        throw new Error("Cannot report a deleted album.");
      }
      const albumRemoved = await isRemoved(reportData.reported_id, "album");
      if (albumRemoved) {
        throw new Error("Album is already removed from public access.");
      }

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO album_reports
          (reporter_id, reported_id, report_type, description, reported_at)
          VALUES ($1, $2, $3, $4, NOW())`,
          [
            reportData.reporter_id,
            reportData.reported_id,
            reportData.report_type,
            reportData.description,
          ]
        );
      });
    } catch (error) {
      console.error("Error reporting album:", error);
      throw error;
    }
  }

  static async reportPlaylist(reportData: {
    reporter_id: UUID;
    reported_id: UUID;
    report_type: ReportType;
    description: string;
  }) {
    try {
      const playlistDeleted = await isDeleted(
        reportData.reported_id,
        "playlist"
      );
      if (playlistDeleted) {
        throw new Error("Cannot report a deleted playlist.");
      }
      const playlistRemoved = await isRemoved(
        reportData.reported_id,
        "playlist"
      );
      if (playlistRemoved) {
        throw new Error("Playlist is already removed from public access.");
      }

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO playlist_reports
          (reporter_id, reported_id, report_type, description, reported_at)
          VALUES ($1, $2, $3, $4, NOW())`,
          [
            reportData.reporter_id,
            reportData.reported_id,
            reportData.report_type,
            reportData.description,
          ]
        );
      });
    } catch (error) {
      console.error("Error reporting playlist:", error);
      throw error;
    }
  }

  static async reportUser(reportData: {
    reporter_id: UUID;
    reported_id: UUID;
    report_type: ReportType;
    description: string;
  }) {
    try {
      const userDeleted = await isDeleted(reportData.reported_id, "user");
      if (userDeleted) {
        throw new Error("Cannot report a deleted user.");
      }
      const userRemoved = await isRemoved(reportData.reported_id, "user");
      if (userRemoved) {
        throw new Error("User is already suspended.");
      }

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO user_reports
          (reporter_id, reported_id, report_type, description, reported_at)
          VALUES ($1, $2, $3, $4, NOW())`,
          [
            reportData.reporter_id,
            reportData.reported_id,
            reportData.report_type,
            reportData.description,
          ]
        );
      });
    } catch (error) {
      console.error("Error reporting user:", error);
      throw error;
    }
  }

  static async appealSong(appealData: {
    userId: UUID;
    reason: string;
    songId: UUID;
  }) {
    try {
      const songDeleted = await isDeleted(appealData.songId, "song");
      if (songDeleted) {
        throw new Error("Song is deleted.");
      }

      const userDeleted = await isDeleted(appealData.userId, "user");
      if (userDeleted) {
        throw new Error("User is deleted.");
      }

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO song_appeals
          (user_id, song_id, reason)
          VALUES ($1, $2, $3)`,
          [appealData.userId, appealData.songId, appealData.reason]
        );
      });
    } catch (error) {
      console.error("Error submitting song appeal:", error);
      throw error;
    }
  }

  static async appealPlaylist(appealData: {
    userId: UUID;
    reason: string;
    playlistId: UUID;
  }) {
    try {
      const playlistDeleted = await isDeleted(
        appealData.playlistId,
        "playlist"
      );
      if (playlistDeleted) {
        throw new Error("Playlist is deleted.");
      }

      const userDeleted = await isDeleted(appealData.userId, "user");
      if (userDeleted) {
        throw new Error("User is deleted.");
      }

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO playlist_appeals
          (user_id, playlist_id, reason)
          VALUES ($1, $2, $3)`,
          [appealData.userId, appealData.playlistId, appealData.reason]
        );
      });
    } catch (error) {
      console.error("Error submitting playlist appeal:", error);
      throw error;
    }
  }

  static async appealAlbum(appealData: {
    userId: UUID;
    reason: string;
    albumId: UUID;
  }) {
    try {
      const albumDeleted = await isDeleted(appealData.albumId, "album");
      if (albumDeleted) {
        throw new Error("Album is deleted.");
      }

      const userDeleted = await isDeleted(appealData.userId, "user");
      if (userDeleted) {
        throw new Error("User is deleted.");
      }

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO album_appeals
          (user_id, album_id, reason)
          VALUES ($1, $2, $3)`,
          [appealData.userId, appealData.albumId, appealData.reason]
        );
      });
    } catch (error) {
      console.error("Error submitting album appeal:", error);
      throw error;
    }
  }

  static async appealUser(appealData: { userId: UUID; reason: string }) {
    try {
      const userDeleted = await isDeleted(appealData.userId, "user");
      if (userDeleted) {
        throw new Error("User is deleted.");
      }

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO user_appeals
          (user_id, reason)
          VALUES ($1, $2)`,
          [appealData.userId, appealData.reason]
        );
      });
    } catch (error) {
      console.error("Error submitting user appeal:", error);
      throw error;
    }
  }

  static async checkPendingAppeal(
    entityType: ReportableEntityType,
    userId: UUID,
    entityId?: UUID
  ): Promise<boolean> {
    try {
      let sql;
      let params;

      switch (entityType) {
        case "song":
          sql = `
            SELECT EXISTS (
              SELECT 1 FROM song_appeals
              WHERE user_id = $1 AND song_id = $2
              AND appeal_status != 'RESOLVED'
              AND NOT EXISTS (
                SELECT 1 FROM deleted_songs
                WHERE song_id = $2
              )
              AND NOT EXISTS (
                SELECT 1 FROM deleted_users
                WHERE user_id = $1
              )
            ) AS has_pending_appeal`;
          params = [userId, entityId];
          break;
        case "playlist":
          sql = `
            SELECT EXISTS (
              SELECT 1 FROM playlist_appeals
              WHERE user_id = $1 AND playlist_id = $2
              AND appeal_status != 'RESOLVED'
              AND NOT EXISTS (
                SELECT 1 FROM deleted_playlists
                WHERE playlist_id = $2
              )
              AND NOT EXISTS (
                SELECT 1 FROM deleted_users
                WHERE user_id = $1
              )
            ) AS has_pending_appeal`;
          params = [userId, entityId];
          break;
        case "album":
          sql = `
            SELECT EXISTS (
              SELECT 1 FROM album_appeals
              WHERE user_id = $1 AND album_id = $2
              AND appeal_status != 'RESOLVED'
              AND NOT EXISTS (
                SELECT 1 FROM deleted_albums
                WHERE album_id = $2
              )
              AND NOT EXISTS (
                SELECT 1 FROM deleted_users
                WHERE user_id = $1
              )
            ) AS has_pending_appeal`;
          params = [userId, entityId];
          break;
        case "user":
          sql = `
            SELECT EXISTS (
              SELECT 1 FROM user_appeals
              WHERE user_id = $1
              AND appeal_status != 'RESOLVED'
              AND NOT EXISTS (
                SELECT 1 FROM deleted_users
                WHERE user_id = $1
              )
            ) AS has_pending_appeal`;
          params = [userId];
          break;
        default:
          throw new Error("Invalid entity type");
      }

      const result = await query(sql, params);
      return result[0]?.has_pending_appeal || false;
    } catch (error) {
      console.error("Error checking pending appeal:", error);
      throw error;
    }
  }

  static async resolveReport(
    reportId: UUID,
    entityType: ReportableEntityType,
    reviewerId: UUID,
    entityId: UUID
  ) {
    try {
      const entityStatusField =
        entityType === "user" ? "status" : "visibility_status";
      const newStatus = entityType === "user" ? "ACTIVE" : "PUBLIC";

      await withTransaction(async (client) => {
        await client.query(
          `UPDATE ${entityType}_reports
          SET report_status = 'RESOLVED', reviewer_id = $1
          WHERE id = $2`,
          [reviewerId, reportId]
        );

        await client.query(
          `UPDATE ${entityType}s
          SET ${entityStatusField} = $1
          WHERE id = $2`,
          [newStatus, entityId]
        );

        await client.query(
          `UPDATE ${entityType}_appeals
          SET appeal_status = 'RESOLVED', reviewer_id = $1
          WHERE ${entityType}_id = $2 AND appeal_status = 'PENDING'`,
          [reviewerId, entityId]
        );
      });
    } catch (error) {
      console.error("Error resolving report:", error);
      throw error;
    }
  }

  static async dismissReport(
    reportId: UUID,
    entityType: ReportableEntityType,
    reviewerId: UUID,
    entityId: UUID
  ) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE ${entityType}_reports
          SET report_status = 'DISMISSED', reviewer_id = $1
          WHERE id = $2`,
          [reviewerId, reportId]
        );

        await client.query(
          `UPDATE ${entityType}_appeals
          SET appeal_status = 'DISMISSED', reviewer_id = $1
          WHERE ${entityType}_id = $2 AND appeal_status = 'PENDING'`,
          [reviewerId, entityId]
        );
      });
    } catch (error) {
      console.error("Error dismissing report:", error);
      throw error;
    }
  }

  static async resolveAppeal(
    entityType: ReportableEntityType,
    reviewerId: UUID,
    entityId: UUID
  ) {
    try {
      const entityStatusField =
        entityType === "user" ? "status" : "visibility_status";
      const newStatus = entityType === "user" ? "ACTIVE" : "PUBLIC";

      await withTransaction(async (client) => {
        await client.query(
          `UPDATE ${entityType}_appeals
          SET appeal_status = 'RESOLVED', reviewer_id = $1
          WHERE ${entityType}_id = $2`,
          [reviewerId, entityId]
        );

        await client.query(
          `UPDATE ${entityType}s
          SET ${entityStatusField} = $1
          WHERE id = $2`,
          [newStatus, entityId]
        );

        await client.query(
          `UPDATE ${entityType}_reports
          SET report_status = 'RESOLVED', reviewer_id = $1
          WHERE reported_id = $2 AND report_status = 'PENDING'`,
          [reviewerId, entityId]
        );
      });
    } catch (error) {
      console.error("Error resolving appeal:", error);
      throw error;
    }
  }

  static async dismissAppeal(
    appealId: UUID,
    entityType: ReportableEntityType,
    reviewerId: UUID
  ) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE ${entityType}_appeals
          SET appeal_status = 'DISMISSED', reviewer_id = $1
          WHERE id = $2`,
          [reviewerId, appealId]
        );
      });
    } catch (error) {
      console.error("Error dismissing appeal:", error);
      throw error;
    }
  }
}
