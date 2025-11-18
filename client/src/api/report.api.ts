import api from "./api";
import type { UUID, ReportableEntity, ReportType } from "@types";

export const reportApi = {
  /**
   * "ARTISTS" CAN BE REPORTED ON THE SITE, SO "ARTIST" IS INCLUDED IN THE REPORTABLE TYPE, HOWEVER, YOU MUST USE ARTIST.USER_ID FOR THE ID!
   */
  async submit(
    type: ReportableEntity,
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
