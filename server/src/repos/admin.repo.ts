import { query } from "config/database.js";
import type { UUID, ReportEntity } from "types"; 

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export default class AdminRepository {
  
  /**
   * Fetches reports filtering by the entity type (e.g., get all SONG reports).
   * It dynamically joins the specific entity table to get the name/title.
   */
  static async getReports(
    entity: ReportEntity,
    limit = 50,
    offset = 0
  ): Promise<any[]> {
    try {
      // Config mapping to switch between tables based on the ENUM
      // Keys match the ReportEntityType enum (Uppercase)
      const entityConfig: Record<ReportEntity, { table: string; titleColumn: string }> = {
        USER: { table: "users", titleColumn: "username" },
        SONG: { table: "songs", titleColumn: "title" },
        ALBUM: { table: "albums", titleColumn: "title" },
        PLAYLIST: { table: "playlists", titleColumn: "title" },
        ARTIST: { table: "artists", titleColumn: "display_name" },  
      };

      const config = entityConfig[entity];

      if (!config) {
        throw new Error(`Invalid report entity type: ${entity}`);
      }

      const sql = `
        SELECT 
          r.id as report_id,
          r.reporter_id,
          r.reported_entity_id as reported_id,
          r.reported_entity_type,
          r.report_type,
          r.description,
          r.status as report_status,
          r.reported_at as created_at,
          r.reviewer_id,
          reporter.username AS reporter_username,
          -- Dynamically select the name/title of the reported item
          reported_entity.${config.titleColumn} AS reported_name
        FROM reports r
        LEFT JOIN users reporter ON r.reporter_id = reporter.id
        -- Dynamic join based on the entity type
        LEFT JOIN ${config.table} reported_entity ON r.reported_entity_id = reported_entity.id
        WHERE r.reported_entity_type = $1 
          AND r.status = 'PENDING'
        ORDER BY r.reported_at DESC
        LIMIT $2 OFFSET $3;
      `;

      // Pass entity directly (assuming it matches the ENUM string exactly)
      const result = await query(sql, [entity, limit, offset]);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error(`Error fetching ${entity.toLowerCase()} reports:`, error);
      throw error;
    }
  }

  /**
   * Updates the report status and takes action on the entity (e.g., suspends user).
   */
  static async updateReportDecision(
    entity: ReportEntity,
    reportId: UUID,
    result: "suspend" | "reject",
    adminId: UUID
  ) {
    try {
      // 1. Determine the new Database Status
      const status: ReportStatus = result === "reject" ? "DISMISSED" : "RESOLVED";

      // 2. Update the report record
      const sql = `
        UPDATE reports
        SET 
          status = $1::report_status, 
          reviewer_id = $2, 
          resolved_at = NOW(), 
          updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `;

      const res = await query(sql, [status, adminId, reportId]);
      const reportResult = Array.isArray(res) ? res[0] : res;

      // 3. If the decision was to suspend/hide, update the actual entity table
      if (status === "RESOLVED" && reportResult) {
        const entityId = reportResult.reported_entity_id;
        let entityUpdateSql = "";

        // Determine the action based on the Entity Type
        switch (entity) {
          case "SONG":
            entityUpdateSql = `UPDATE songs SET visibility_status = 'PRIVATE' WHERE id = $1`;
            break;

          case "USER":
            entityUpdateSql = `UPDATE users SET status = 'SUSPENDED' WHERE id = $1`;
            break;

          case "ARTIST":
            entityUpdateSql = `UPDATE artists SET status = 'SUSPENDED' WHERE id = $1`;
            break;

          case "ALBUM":
            entityUpdateSql = `UPDATE albums SET visibility_status = 'UNLISTED' WHERE id = $1`;
            break;

          case "PLAYLIST":
            entityUpdateSql = `UPDATE playlists SET visibility_status = 'private' WHERE id = $1`;
            break;
        }

        if (entityUpdateSql && entityId) {
          await query(entityUpdateSql, [entityId]);
        }
      }

      return reportResult;
    } catch (error) {
      console.error(`Error updating report decision for ${entity}:`, error);
      throw error;
    }
  }
}