import api from "./api";
import type {
  FeaturedPlaylist,
  CoverGradient,
  UUID,
  User,
  UserInfo,
  CoverEntityType,
  UserOrderByColumn,
  OrderByDirection,
} from "@types";

export const adminApi = {
  async getUsersInfo(options?: {
    orderByColumn?: UserOrderByColumn;
    orderByDirection?: OrderByDirection;
    limit?: number;
    offset?: number;
  }) {
    try {
      const response = await api.get<UserInfo[]>(`/admin/users`, {
        params: options,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
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

  async verifyArtist(artistId: UUID, userId: UUID) {
    const response = await api.post(`/admin/artists/${artistId}/verify`, {
      userId,
    });
    return response.data;
  },

  async unverifyArtist(artistId: UUID, userId: UUID) {
    const response = await api.post(`/admin/artists/${artistId}/unverify`, {
      userId,
    });
    return response.data;
  },

  async getFeaturedPlaylist() {
    try {
      const response = await api.get<FeaturedPlaylist>(
        `/admin/featured-playlist`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async setFeaturedPlaylist(playlistId: UUID) {
    const response = await api.post(`/admin/featured-playlist`, { playlistId });
    return response.data;
  },

  //indiv
  async getCoverGradient(entityId: UUID, entityType: CoverEntityType) {
    const response = await api.get<CoverGradient>(
      `/admin/${entityType}/${entityId}/cover-gradient`
    );
    return response.data;
  },
};
