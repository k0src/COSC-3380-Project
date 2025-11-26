import type { UUID, ReportType } from "@types";
import { withTransaction } from "@config/database.js";
import { isDeleted, isRemoved } from "@util";

export default class ReportService {
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
}
