import api from "./api";
import type { UUID } from "@types";

export type EntityType = "user" | "song" | "album" | "playlist" | "artist";

export type Report = {
  report_id: UUID;
  reporter_id: UUID;
  reported_id: UUID;
  report_type: string;
  description: string;
  report_result?: "suspend" | "reject" | null;
  report_status: string;
  created_at: string;
  reviewer_id?: UUID | null;
  entity_name?: string; // optional joined data
  reporter_username?: string; // username of the person who made the report
  reported_username?: string; // username of the person being reported
};

export const AdminAPI = {
  async getReports(entity: EntityType) {
    const response = await api.get(`/admin/reports/${entity}`);
    return response.data.data; // match Express response
  },

  async decideReport(
    entity: EntityType,
    reportId: UUID,
    result: "suspend" | "reject",
    adminId: UUID
  ) {
    const response = await api.post(
      `/admin/reports/${entity}/${reportId}/decide`,
      {
        result,
        reviewer_id: adminId,
      }
    );
    return response.data;
  },
};
