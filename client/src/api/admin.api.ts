import api from "./api";
import type {
  AccessContext,
  FeaturedPlaylist,
  CoverGradient,
  UUID,
  Song,
  Artist,
  SongOptions,
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

  async getNewFromFollowedArtists(
    userId: UUID,
    accessContext: AccessContext,
    limit: number = 10
  ) {
    const response = await api.get<Song[]>(
      `/admin/users/${userId}/new-from-followed-artists`,
      {
        params: {
          role: accessContext.role,
          userId: accessContext.userId,
          scope: accessContext.scope,
          limit,
        },
      }
    );
    return response.data;
  },

  async getTopArtist(days: number = 30) {
    const response = await api.get<Artist>(`/admin/top-artist`, {
      params: { days },
    });
    return response.data;
  },

  async getTrendingSongs(accessContext: AccessContext, options?: SongOptions) {
    try {
      const response = await api.get<Song[]>(`/admin/trending-songs`, {
        params: {
          ...options,
          role: accessContext.role,
          userId: accessContext.userId,
          scope: accessContext.scope,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },
};
