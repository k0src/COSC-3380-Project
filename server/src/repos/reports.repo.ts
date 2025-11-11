import { query } from "../config/database.js";
import type { UUID } from "../types";

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
    reportedEntityType: "SONG" | "ARTIST" | "ALBUM" | "PLAYLIST";
    reason: "EXPLICIT" | "VIOLENT" | "HATEFUL" | "COPYRIGHT";
    description: string;
  }) {
    // Based on your admin code, it looks like all reports go into user_reports table
    const sql = `
      INSERT INTO ${reportedEntityType.toLowerCase()}_reports (
        reporter_id,
        reported_id,
        report_type,
        description,
        report_status,
        reported_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;

    const values = [
      reporterId,
      reportedEntityId,
      reason, // This becomes report_type
      description,
      "PENDING_REVIEW" // Use the correct enum value from your database
    ];

    const result = await query(sql, values);
    return result; // Fixed: use .rows[0] not [0]
  }
}