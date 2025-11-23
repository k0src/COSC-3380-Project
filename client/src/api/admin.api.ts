import api from "./api";
import type { UUID, ReportEntity } from "@types";

export const AdminAPI = {
  async getReports(entity: ReportEntity) {
    const response = await api.get(`/admin/reports/${entity}`);
    return response.data.data; // match Express response
  },

  async decideReport(
    entity: ReportEntity,
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
