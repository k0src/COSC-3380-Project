import type { UUID, ReportType } from "@types";
import { withTransaction } from "@config/database.js";

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
          `INSERT INTO reports
          (reporter_id, reported_entity_id, reported_entity_type, report_type, description, status, reported_at)
          VALUES ($1, $2, 'SONG', $3, $4, 'PENDING', NOW())`,
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
          `INSERT INTO reports
          (reporter_id, reported_entity_id, reported_entity_type, report_type, description, status, reported_at)
          VALUES ($1, $2, 'ALBUM', $3, $4, 'PENDING', NOW())`,
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
          `INSERT INTO reports
          (reporter_id, reported_entity_id, reported_entity_type, report_type, description, status, reported_at)
          VALUES ($1, $2, 'PLAYLIST', $3, $4, 'PENDING', NOW())`,
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
          `INSERT INTO reports
          (reporter_id, reported_entity_id, reported_entity_type, report_type, description, status, reported_at)
          VALUES ($1, $2, 'USER', $3, $4, 'PENDING', NOW())`,
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

  static async reportArtist(reportData: {
    reporter_id: UUID;
    reported_id: UUID;
    report_type: ReportType;
    description: string;
  }) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO reports
          (reporter_id, reported_entity_id, reported_entity_type, report_type, description, status, reported_at)
          VALUES ($1, $2, 'ARTIST', $3, $4, 'PENDING', NOW())`,
          [
            reportData.reporter_id,
            reportData.reported_id,
            reportData.report_type,
            reportData.description,
          ]
        );
      });
    } catch (error) {
      console.error("Error reporting artist:", error);
      throw error;
    }
  }
}
