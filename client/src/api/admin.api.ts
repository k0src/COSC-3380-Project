import api from "./api";
import type {
  AccessContext,
  FeaturedPlaylist,
  CoverGradient,
  UUID,
  Artist,
  UserGrowthData,
  AdminDashboardStats,
  PlatformActivity,
  RecentReport,
  User,
  UserInfo,
} from "@types";

export type CoverEntityType = "song" | "playlist" | "album";

export const adminApi = {
  async getDashboardStats() {
    const response = await api.get<AdminDashboardStats>(
      `/admin/dashboard/stats`
    );
    return response.data;
  },

  async getUserGrowth(days: number = 30) {
    const response = await api.get<UserGrowthData[]>(
      `/admin/dashboard/user-growth`,
      {
        params: { days },
      }
    );
    return response.data;
  },

  async getTopArtists(limit: number = 10) {
    const response = await api.get<Artist[]>(`/admin/dashboard/top-artists`, {
      params: { limit },
    });
    return response.data;
  },

  async getPlatformActivity(days: number = 30) {
    const response = await api.get<PlatformActivity[]>(
      `/admin/dashboard/platform-activity`,
      {
        params: { days },
      }
    );
    return response.data;
  },

  async getRecentReports(limit: number, offset: number) {
    const response = await api.get<RecentReport[]>(
      `/admin/dashboard/recent-reports`,
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },

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

  async getAllUsers(limit: number, offset: number) {
    const response = await api.get<UserInfo[]>(`/admin/users`, {
      params: { limit, offset },
    });
    return response.data;
  },

  async update(
    id: UUID,
    data: {
      username?: string;
      email?: string;
      new_password?: string;
      current_password?: string;
      authenticated_with?: string;
      role?: string;
      profile_picture_url?: File | null;
      artist_id?: UUID;
      status?: string;
      is_private?: boolean;
    }
  ) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const response = await api.put<User>(
      `/admin/users/${id}/update`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async suspendUser(userId: UUID) {
    const response = await api.post(`/admin/users/${userId}/suspend`);
    return response.data;
  },

  async deactivateUser(userId: UUID) {
    const response = await api.post(`/admin/users/${userId}/deactivate`);
    return response.data;
  },

  async reactivateUser(userId: UUID) {
    const response = await api.post(`/admin/users/${userId}/reactivate`);
    return response.data;
  },

  async verifyArtist(artistId: UUID) {
    const response = await api.post(`/admin/artists/${artistId}/verify`);
    return response.data;
  },

  async unverifyArtist(artistId: UUID) {
    const response = await api.post(`/admin/artists/${artistId}/unverify`);
    return response.data;
  },
};
