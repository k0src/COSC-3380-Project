import { query } from "config/database.js";
import type { UUID } from "types";

export type ReportEntity = "user" | "song" | "album" | "playlist";

export default class AdminRepository {
  static async getReports(
    entity: ReportEntity,
    limit = 50,
    offset = 0
  ): Promise<any[]> {
    try {

      const entityConfig = {
        user: { table: 'users', titleColumn: 'username' },
        song: { table: 'songs', titleColumn: 'title' },
        album: { table: 'albums', titleColumn: 'title' },
        playlist: { table: 'playlists', titleColumn: 'name' }
      };

      const config = entityConfig[entity];
      const reportTable = `"${entity}_reports"`; // quoted table name

      const sql = `
        SELECT 
          r.reporter_id,
          r.reported_id,
          r.report_type,
          r.description,
          r.report_status,
          r.reported_at as created_at,
          r.reviewer_id,
          r.reported_id as report_id,
          reporter.username AS reporter_username,
          reported_entity.${config.titleColumn} AS reported_username
        FROM ${reportTable} r
        LEFT JOIN users reporter ON r.reporter_id = reporter.id
        LEFT JOIN ${config.table} reported_entity ON r.reported_id = reported_entity.id
        WHERE r.report_status = 'PENDING_REVIEW'
        ORDER BY r.reported_at DESC
        LIMIT $1 OFFSET $2;
      `;

      const result = await query(sql, [limit, offset]);
      return Array.isArray(result) ? result : result ?? result;
    } catch (error) {
      console.error(`Error fetching ${entity} reports:`, error);
      throw error;
    }
  }

  static async updateReportDecision(
    entity: ReportEntity,
    reportId: UUID,
    result: "suspend" | "reject",
    adminId: UUID
  ) {
    const table = `"${entity}_reports"`;
    
    // Convert the result to the proper status value based on the enum
    const status = result === "reject" ? "DISMISSED" : "ACTION_TAKEN";

    // Update the report status
    const sql = `
      UPDATE ${table}
      SET report_status = $1, reviewer_id = $2
      WHERE reported_id = $3
      RETURNING *;
    `;

    const res = await query(sql, [status, adminId, reportId]);
    const reportResult = Array.isArray(res) ? res[0] : res ?? res;

    // If action is taken (suspend), update the corresponding entity
    if (status === "ACTION_TAKEN") {
      let entityUpdateSql = "";
      
      switch (entity) {
        case "song":
          entityUpdateSql = `
            UPDATE songs
            SET visibility_status = 'PRIVATE'
            WHERE id = $1;
          `;
          break;
        
        case "user":
          entityUpdateSql = `
            UPDATE users
            SET status = 'SUSPENDED'
            WHERE id = $1;
          `;
          break;
        
        case "album":
          entityUpdateSql = `
            UPDATE albums
            SET visibility_status = 'UNLISTED'
            WHERE id = $1;
          `;
          break;
        
        case "playlist":
          entityUpdateSql = `
            UPDATE playlists
            SET is_public = false
            WHERE id = $1;
          `;
          break;
      }

      if (entityUpdateSql) {
        await query(entityUpdateSql, [reportId]);
      }
    }

    return reportResult;
  }
}