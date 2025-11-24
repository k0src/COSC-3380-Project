import api from "./api";
import type { UUID, ReportableEntityType, ReportType } from "@types";

export const reportApi = {
  async submit(
    type: ReportableEntityType,
    data: {
      reporter_id: UUID;
      reported_id: UUID;
      report_type: ReportType;
      description: string;
    }
  ) {
    const response = await api.post(`/report/${type}`, data);
    return response.data;
  },
};
