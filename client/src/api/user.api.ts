import api from "./api";
import type {
  UUID,
  EntityType,
  Playlist,
  Song,
  Album,
  User,
  UserSettings,
  AccessContext,
  UserOrderByColumn,
  OrderByDirection,
  PlaylistOrderByColumn,
  AlbumOrderByColumn,
  SongOrderByColumn,
} from "@types";

export const userApi = {
  async create(data: {
    username: string;
    email: string;
    password: string;
    profile_picture_url?: File | null;
    role?: string;
  }) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const response = await api.post<User>(`/users`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
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

    const response = await api.put<User>(`/users/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async delete(id: UUID) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async getUser(userId: UUID, accessContext: AccessContext) {
    try {
      const response = await api.get<User>(`/users/${userId}`, {
        params: {
          role: accessContext.role,
          userId: accessContext.userId,
          scope: accessContext.scope,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getManyUsers(
    accessContext: AccessContext,
    options?: {
      orderByColumn?: UserOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Song[]>(`/users`, {
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

  async getPlaylists(
    userId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: PlaylistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Playlist[]>(`/users/${userId}/playlists`, {
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

  async getLikedSongs(
    userId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: SongOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Song[]>(`/users/${userId}/likes/songs`, {
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

  async getLikedAlbums(
    userId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: AlbumOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Album[]>(`/users/${userId}/likes/albums`, {
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

  async getLikedPlaylists(
    userId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: PlaylistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Playlist[]>(
        `/users/${userId}/likes/playlists`,
        {
          params: {
            ...options,
            role: accessContext.role,
            userId: accessContext.userId,
            scope: accessContext.scope,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getLikedCount(id: UUID, entityType: EntityType) {
    const response = await api.get<{ likedCount: number }>(
      `/users/${id}/likes/count?entityType=${entityType}`
    );
    return response.data.likedCount;
  },

  async getFollowers(
    userId: UUID,
    options?: {
      orderByColumn?: UserOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<User[]>(`/users/${userId}/followers`, {
      params: options,
    });
    return response.data;
  },

  async getFollowing(
    userId: UUID,
    options?: {
      orderByColumn?: UserOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<User[]>(`/users/${userId}/following`, {
      params: options,
    });
    return response.data;
  },

  async getFollowerCount(userId: UUID) {
    const response = await api.get<{ followerCount: number }>(
      `/users/${userId}/followers/count`
    );
    return response.data.followerCount;
  },

  async getFollowingCount(userId: UUID) {
    const response = await api.get<{ followingCount: number }>(
      `/users/${userId}/following/count`
    );
    return response.data.followingCount;
  },

  async toggleLike(id: UUID, entityId: UUID, entityType: EntityType) {
    const response = await api.post(`/users/${id}/likes`, {
      entityId,
      entityType,
    });
    return response.data;
  },

  async checkLikeStatus(id: UUID, entityId: UUID, entityType: EntityType) {
    const response = await api.get(
      `/users/${id}/likes/check?entityType=${entityType}&entityId=${entityId}`
    );
    return response.data;
  },

  async toggleFollowUser(followerId: UUID, followingId: UUID) {
    const response = await api.post(`/users/${followerId}/following`, {
      followingId,
    });
    return response.data;
  },

  async checkFollowStatus(followerId: UUID, followingId: UUID) {
    const response = await api.get(
      `/users/${followerId}/following/check?followingId=${followingId}`
    );
    return response.data;
  },

  async getUserCount() {
    const response = await api.get<{ userCount: number }>(`/users/count`);
    return response.data.userCount;
  },

  async getSettings(id: UUID) {
    const response = await api.get<UserSettings>(`/users/${id}/settings`);
    return response.data;
  },

  async updateSettings(id: UUID, settings: Partial<UserSettings>) {
    const response = await api.put<UserSettings>(
      `/users/${id}/settings`,
      settings
    );
    return response.data;
  },
};
