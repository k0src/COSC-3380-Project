import api from "./api";
import type { UUID } from "@types";

export type CreateReportData = {
  reporterId: UUID;
  reportedEntityId: UUID;
  reportedEntityType: "SONG" | "ARTIST" | "ALBUM" | "PLAYLIST";
  reason: "EXPLICIT" | "VIOLENT" | "HATEFUL" | "COPYRIGHT";
  description: string;
};

export type ReportResponse = {
  report_id: UUID;
  reporter_id: UUID;
  reported_id: UUID;
  report_type: string;
  description: string;
  report_status: string;
  reported_at: string;
  reviewer_id?: UUID | null;
};

export const reportsApi = {
  async createReport(data: CreateReportData) {
    const response = await api.post("/reports", data);
    return response.data; // match Express response
  },
};
