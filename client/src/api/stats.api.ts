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

  async getArtistTopSongs(
    artistId: UUID,
    options: { timeRange?: string; limit?: number } = {}
  ) {
    const { timeRange = "30d", limit = 5 } = options;
    const days = timeRange === "30d" ? 30 : 7;
    const response = await api.get(`/stats/artists/${artistId}/top-songs`, {
      params: { days, limit },
    });
    return response.data;
  },

  async getArtistTopPlaylists(
    artistId: UUID,
    options: { timeRange?: string; limit?: number } = {}
  ) {
    const { timeRange = "30d", limit = 5 } = options;
    const days = timeRange === "30d" ? 30 : 7;
    const response = await api.get(`/stats/artists/${artistId}/top-playlists`, {
      params: { days, limit },
    });
    return response.data;
  },

  async checkArtistHasSongs(artistId: UUID) {
    const response = await api.get<{ hasSongs: boolean }>(
      `/stats/artists/${artistId}/has-songs`
    );
    return response.data;
  },
};
