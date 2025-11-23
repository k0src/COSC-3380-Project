import api from "./api";
import type { 
  UUID, 
  ReportEntity,
  AccessContext,
  FeaturedPlaylist,
  CoverGradient, } from "@types";

export type CoverEntityType = "song" | "playlist" | "album";

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

export const adminApi = {
  async getFeaturedPlaylist(accessContext: AccessContext) {
    try {
      const response = await api.get<FeaturedPlaylist>(
        `/admin/featured-playlist`,
        {
          params: {
            role: accessContext.role,
            userId: accessContext.userId,
            scope: accessContext.scope,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getCoverGradient(entityId: UUID, entityType: CoverEntityType) {
    const response = await api.get<CoverGradient>(
      `/admin/${entityType}/${entityId}/cover-gradient`
    );
    return response.data;
  },
};
