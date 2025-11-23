import { query } from "../config/database.js";
import type { UUID, ReportEntity, ReportType } from "../types";

export default class ReportRepository {
  static async createReport({
    reporterId,
    reportedEntityId,
    reportedEntityType,
    reason,
    description,
  }: {
    reporterId: UUID;
    reportedEntityId: UUID;
    reportedEntityType: ReportEntity;
    reason: ReportType;
    description: string;
  }) {
    const sql = `
      INSERT INTO reports (
        reporter_id,
        reported_entity_id,
        reported_entity_type,
        report_type,
        description,
        status,
        reported_at
      )
      VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW())
      RETURNING *;
    `;

    const values = [
      reporterId,
      reportedEntityId,
      reportedEntityType,
      reason, // report_type
      description
    ];

    const result = await query(sql, values);
    return result;
  }
}