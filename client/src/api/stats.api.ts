import api from "./api";
import type { Comment, Playlist, Song, UUID, TopListener } from "@types";

export const statsApi = {
  async getArtistQuickStats(artistId: UUID, days: number = 30) {
    const response = await api.get(`/stats/artists/${artistId}/quick`, {
      params: { days },
    });
    return response.data;
  },

  async getArtistTopSong(artistId: UUID, days: number = 30) {
    const response = await api.get<Song>(
      `/stats/artists/${artistId}/top-song`,
      {
        params: { days },
      }
    );
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
    const response = await api.get<Comment[]>(
      `/stats/artists/${artistId}/comments`,
      {
        params: { limit, orderBy, orderDirection },
      }
    );
    return response.data;
  },

  async getArtistTopSongs(
    artistId: UUID,
    options: { timeRange?: string; limit?: number } = {}
  ) {
    const { timeRange = "30d", limit = 5 } = options;
    const days = timeRange === "30d" ? 30 : 7;
    const response = await api.get<Song[]>(
      `/stats/artists/${artistId}/top-songs`,
      {
        params: { days, limit },
      }
    );
    return response.data;
  },

  async getArtistTopPlaylists(
    artistId: UUID,
    options: { timeRange?: string; limit?: number } = {}
  ) {
    const { timeRange = "30d", limit = 5 } = options;
    const days = timeRange === "30d" ? 30 : 7;
    const response = await api.get<Playlist[]>(
      `/stats/artists/${artistId}/top-playlists`,
      {
        params: { days, limit },
      }
    );
    return response.data;
  },

  async getArtistTopListeners(
    artistId: UUID,
    options: { timeRange?: string; limit?: number } = {}
  ) {
    const { timeRange = "30d", limit = 5 } = options;
    const days = timeRange === "30d" ? 30 : 7;
    const response = await api.get<TopListener[]>(
      `/stats/artists/${artistId}/top-listeners`,
      {
        params: { days, limit },
      }
    );
    return response.data;
  },

  async getArtistRecentRelease(artistId: UUID) {
    const response = await api.get<Song>(
      `/stats/artists/${artistId}/recent-release`
    );
    return response.data;
  },

  async getArtistAllTimeStats(artistId: UUID) {
    const response = await api.get(`/stats/artists/${artistId}/all-time`);
    return response.data;
  },

  async getArtistStreamsBarChartData(
    artistId: UUID,
    timeRange: string = "30d"
  ) {
    const response = await api.get(
      `/stats/artists/${artistId}/streams-bar-chart`,
      {
        params: { timeRange },
      }
    );
    return response.data;
  },

  async getArtistListenersPieChartData(artistId: UUID) {
    const response = await api.get(
      `/stats/artists/${artistId}/listeners-pie-chart`
    );
    return response.data;
  },

  async getArtistFollowersData(artistId: UUID) {
    const response = await api.get(`/stats/artists/${artistId}/followers-data`);
    return response.data;
  },
};
