import type { UUID, ReportType } from "@types";
import { withTransaction } from "@config/database.js";

/**
 * Service for managing and submitting user reports.
 */
export default class ReportService {
  static async reportSong(reportData: {
    reporter_id: UUID;
    reported_id: UUID;
    report_type: ReportType;
    description: string;
  }) {
    try {
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

  static async reportAlbum(reportData: {
    reporter_id: UUID;
    reported_id: UUID;
    report_type: ReportType;
    description: string;
  }) {
    try {
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
}
