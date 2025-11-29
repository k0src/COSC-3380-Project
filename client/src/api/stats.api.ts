import api from "./api";
import type {
  Playlist,
  Song,
  UUID,
  TopListener,
  AdminDashboardStats,
  AdminUserGrowthData,
  Artist,
  PlatformActivity,
} from "@types";

export const statsApi = {
  // Admin Dashboard Stats
  async getDashboardStats() {
    const response = await api.get<AdminDashboardStats>(
      `/stats/admin/dashboard/stats`
    );
    return response.data;
  },

  async getUserGrowth(days: number = 30) {
    const response = await api.get<AdminUserGrowthData[]>(
      `/stats/admin/dashboard/user-growth`,
      {
        params: { days },
      }
    );
    return response.data;
  },

  async getTopArtists(limit: number = 10) {
    const response = await api.get<Artist[]>(
      `/stats/admin/dashboard/top-artists`,
      {
        params: { limit },
      }
    );
    return response.data;
  },

  async getPlatformActivity(days: number = 30) {
    const response = await api.get<PlatformActivity[]>(
      `/stats/admin/dashboard/platform-activity`,
      {
        params: { days },
      }
    );
    return response.data;
  },

  // Artist Dashboard Stats
  async getArtistQuickStats(artistId: UUID, days: number = 30) {
    const response = await api.get(`/stats/artists/${artistId}/quick`, {
      params: { days },
    });
    return response.data;
  },

  async getArtistTopSong(artistId: UUID, userId: UUID, days: number = 30) {
    const response = await api.get<Song>(
      `/stats/artists/${artistId}/top-song`,
      {
        params: { userId, days },
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

  async getArtistTopSongs(
    artistId: UUID,
    userId: UUID,
    options: { timeRange?: string; limit?: number } = {}
  ) {
    const { timeRange = "30d", limit = 5 } = options;
    const days = timeRange === "30d" ? 30 : 7;
    const response = await api.get<Song[]>(
      `/stats/artists/${artistId}/top-songs`,
      {
        params: { userId, days, limit },
      }
    );
    return response.data;
  },

  async getArtistTopPlaylists(
    artistId: UUID,
    userId: UUID,
    options: { timeRange?: string; limit?: number } = {}
  ) {
    const { timeRange = "30d", limit = 5 } = options;
    const days = timeRange === "30d" ? 30 : 7;
    const response = await api.get<Playlist[]>(
      `/stats/artists/${artistId}/top-playlists`,
      {
        params: { userId, days, limit },
      }
    );
    return response.data;
  },

  async getArtistTopListeners(
    artistId: UUID,
    userId: UUID,
    options: { timeRange?: string; limit?: number } = {}
  ) {
    const { timeRange = "30d", limit = 5 } = options;
    const days = timeRange === "30d" ? 30 : 7;
    const response = await api.get<TopListener[]>(
      `/stats/artists/${artistId}/top-listeners`,
      {
        params: { userId, days, limit },
      }
    );
    return response.data;
  },

  async getArtistRecentRelease(artistId: UUID, userId: UUID) {
    const response = await api.get<Song>(
      `/stats/artists/${artistId}/recent-release`,
      { params: { userId } }
    );
    return response.data;
  },

  async getArtistAllTimeStats(artistId: UUID, userId: UUID) {
    const response = await api.get(`/stats/artists/${artistId}/all-time`, {
      params: { userId },
    });
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
