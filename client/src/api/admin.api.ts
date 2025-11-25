import api from "./api";
import type {
  AccessContext,
  FeaturedPlaylist,
  CoverGradient,
  UUID,
  Artist,
  AdminUserGrowthData,
  AdminDashboardStats,
  PlatformActivity,
  Report,
  Appeal,
  User,
  UserInfo,
  CoverEntityType,
  ReportableEntityType,
} from "@types";

export const adminApi = {
  async getDashboardStats() {
    const response = await api.get<AdminDashboardStats>(
      `/admin/dashboard/stats`
    );
    return response.data;
  },

  async getUserGrowth(days: number = 30) {
    const response = await api.get<AdminUserGrowthData[]>(
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
    const response = await api.get<Report[]>(
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

  async updateUser(
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

  async setFeaturedPlaylist(playlistId: UUID) {
    const response = await api.post(
      `/admin/playlists/${playlistId}/set-featured`
    );
    return response.data;
  },

  async submitAppeal(
    userId: UUID,
    entityType: ReportableEntityType,
    entityId: UUID,
    reason: string
  ) {
    const response = await api.post(
      `/admin/appeals/${entityType}/${entityId}`,
      { userId, reason }
    );
    return response.data;
  },

  async checkPendingAppeal(
    userId: UUID,
    entityType: ReportableEntityType,
    entityId: UUID
  ) {
    const response = await api.get<{ hasPendingAppeal: boolean }>(
      `/admin/appeals/${entityType}/${entityId}/check`,
      { params: { userId } }
    );
    return response.data;
  },

  async getAllReports(limit: number, offset: number) {
    const response = await api.get<Report[]>(`/admin/reports`, {
      params: { limit, offset },
    });
    return response.data;
  },

  async getRecentAppeals(limit: number, offset: number) {
    const response = await api.get<Appeal[]>(
      `/admin/dashboard/recent-appeals`,
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },

  async getAllAppeals(limit: number, offset: number) {
    const response = await api.get<Appeal[]>(`/admin/appeals`, {
      params: { limit, offset },
    });
    return response.data;
  },

  async getAppealsForEntity(entityType: ReportableEntityType, entityId: UUID) {
    const response = await api.get<Appeal[]>(
      `/admin/appeals/${entityType}/${entityId}`
    );
    return response.data;
  },

  async resolveReport(
    id: UUID,
    entityType: ReportableEntityType,
    entityId: UUID,
    reviewerId: UUID
  ) {
    const response = await api.post(`/admin/reports/${id}/resolve`, {
      entityType,
      entityId,
      reviewerId,
    });
    return response.data;
  },

  async dismissReport(
    id: UUID,
    entityType: ReportableEntityType,
    entityId: UUID,
    reviewerId: UUID
  ) {
    const response = await api.post(`/admin/reports/${id}/dismiss`, {
      entityType,
      entityId,
      reviewerId,
    });
    return response.data;
  },

  async resolveAppeal(
    id: UUID,
    entityType: ReportableEntityType,
    entityId: UUID,
    reviewerId: UUID
  ) {
    const response = await api.post(`/admin/appeals/${id}/resolve`, {
      entityType,
      entityId,
      reviewerId,
    });
    return response.data;
  },

  async dismissAppeal(
    id: UUID,
    entityType: ReportableEntityType,
    entityId: UUID,
    reviewerId: UUID
  ) {
    const response = await api.post(`/admin/appeals/${id}/dismiss`, {
      entityType,
      entityId,
      reviewerId,
    });
    return response.data;
  },
};
