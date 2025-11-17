import api from "./api";
import type {
  UUID,
  EntityType,
  Playlist,
  Song,
  Album,
  Comment,
  User,
  UserSettings,
} from "@types";

export const userApi = {
  async getUserById(id: UUID) {
    const response = await api.get<User>(`/users/${id}`, {
      params: { includeUser: true },
    });
    return response.data;
  },

  async addToHistory(id: UUID, entityId: UUID, entityType: EntityType) {
    await api.put(`/users/${id}/history`, {
      entityId,
      entityType,
    });
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

  async getPlaylists(
    id: UUID,
    options?: {
      includeLikes?: boolean;
      includeSongCount?: boolean;
      includeRuntime?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Playlist[]>(`/users/${id}/playlists`, {
      params: options,
    });
    return response.data;
  },

  async getLikedCount(id: UUID, entityType: EntityType) {
    const response = await api.get<{ likedCount: number }>(
      `/users/${id}/likes/count?entityType=${entityType}`
    );
    return response.data.likedCount;
  },

  async getLikedSongs(
    id: UUID,
    options?: {
      includeAlbums?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
      includeComments?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Song[]>(`/users/${id}/likes/songs`, {
      params: options,
    });
    return response.data;
  },

  async getLikedAlbums(
    id: UUID,
    options?: {
      includeArtist?: boolean;
      includeLikes?: boolean;
      includeRuntime?: boolean;
      includeSongCount?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Album[]>(`/users/${id}/likes/albums`, {
      params: options,
    });
    return response.data;
  },

  async getLikedPlaylists(
    id: UUID,
    options?: {
      includeUser?: boolean;
      includeLikes?: boolean;
      includeSongCount?: boolean;
      includeRuntime?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Playlist[]>(`/users/${id}/likes/playlists`, {
      params: options,
    });
    return response.data;
  },

  async getLikedComments(
    id: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Comment[]>(`/users/${id}/likes/comments`, {
      params: options,
    });
    return response.data;
  },

  async getFollowers(id: UUID) {
    const response = await api.get<User[]>(`/users/${id}/followers`);
    return response.data;
  },

  async getFollowing(id: UUID) {
    const response = await api.get<User[]>(`/users/${id}/following`);
    return response.data;
  },

  async getFollowerCount(id: UUID) {
    const response = await api.get<{ followerCount: number }>(
      `/users/${id}/followers/count`
    );
    return response.data.followerCount;
  },

  async getFollowingCount(id: UUID) {
    const response = await api.get<{ followingCount: number }>(
      `/users/${id}/following/count`
    );
    return response.data.followingCount;
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

  async delete(id: UUID) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
