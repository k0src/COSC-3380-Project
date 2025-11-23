import api from "./api";
import type {
  AccessContext,
  FeaturedPlaylist,
  CoverGradient,
  UUID,
} from "@types";

export type CoverEntityType = "song" | "playlist" | "album";

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
