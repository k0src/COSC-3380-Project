import api from "./api";
import type { UUID } from "@types";

export const statsApi = {
  async getArtistQuickStats(artistId: UUID, days: number = 30) {
    const response = await api.get(`/stats/artists/${artistId}/quick`, {
      params: { days },
    });
    return response.data;
  },

  async getArtistTopSong(artistId: UUID, days: number = 30) {
    const response = await api.get(`/stats/artists/${artistId}/top-song`, {
      params: { days },
    });
    return response.data;
  },

  async getArtistDailyStreams(artistId: UUID, days: number = 30) {
    const response = await api.get<number[]>(
      `/stats/artists/${artistId}/daily-streams`,
      {
        params: { days },
      }
    );
    return response.data;
  },

  async getArtistComments(
    artistId: UUID,
    limit: number = 10,
    orderBy: string = "commented_at",
    orderDirection: "ASC" | "DESC" = "DESC"
  ) {
    const response = await api.get(`/stats/artists/${artistId}/comments`, {
      params: { limit, orderBy, orderDirection },
    });
    return response.data;
  },
};
