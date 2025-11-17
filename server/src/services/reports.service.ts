import {ReportRepository} from "@repositories";
import type { UUID } from "../types";

export default class ReportService {
  static async createReport(data: {
    reporterId: UUID;
    reportedEntityId: UUID;
    reportedEntityType: "SONG" | "ARTIST" | "ALBUM" | "PLAYLIST";
    reason: "EXPLICIT" | "VIOLENT" | "HATEFUL" | "COPYRIGHT";
    description: string;
  }) {
    const { reporterId, reportedEntityId, reportedEntityType, reason, description } = data;

    if (!reporterId || !reportedEntityId || !reportedEntityType || !reason || !description) {
      throw new Error("Missing required fields for report.");
    }

    // Validate that the entity type is supported
    const validEntityTypes = ["SONG", "ARTIST", "ALBUM", "PLAYLIST"];
    if (!validEntityTypes.includes(reportedEntityType)) {
      throw new Error("Invalid entity type for report.");
    }

    // Validate that the reason is supported
    const validReasons = ["EXPLICIT", "VIOLENT", "HATEFUL", "COPYRIGHT"];
    if (!validReasons.includes(reason)) {
      throw new Error("Invalid reason for report.");
    }

    return await ReportRepository.createReport(data);
  }
}