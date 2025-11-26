import api from "./api";
import type {
  PlaylistSong,
  Playlist,
  UUID,
  User,
  AccessContext,
  OrderByDirection,
  PlaylistOrderByColumn,
  SongOrderByColumn,
} from "@types";

export const playlistApi = {
  async create(data: {
    owner_id: UUID;
    artist_id?: UUID;
    title: string;
    description?: string;
    visibility_status?: "PUBLIC" | "PRIVATE";
    image_url?: File | null;
  }) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const response = await api.post<Playlist>(`/playlists`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async update(
    playlistId: UUID,
    data: {
      owner_id: UUID;
      title?: string;
      description?: string;
      visibility_status?: "PUBLIC" | "PRIVATE";
      image_url?: File | null;
    }
  ) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const response = await api.put<Playlist>(
      `/playlists/${playlistId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async delete(playlistId: UUID) {
    const response = await api.delete(`/playlists/${playlistId}`);
    return response.data;
  },

  async bulkDelete(playlistIds: UUID[]) {
    const response = await api.post(`/playlists/bulk-delete`, { playlistIds });
    return response.data;
  },

  async getPlaylistDetails(id: UUID, accessContext: AccessContext) {
    try {
      const response = await api.get<Playlist>(`/playlists/${id}`, {
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

  async getManyPlaylists(
    accessContext: AccessContext,
    options?: {
      orderByColumn?: PlaylistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Playlist[]>(`/playlists`, {
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

  async getSongs(
    playlistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: SongOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<PlaylistSong[]>(
        `/playlists/${playlistId}/songs`,
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

  async addSongs(playlistId: UUID, songIds: UUID[]) {
    const response = await api.put(`/playlists/${playlistId}/songs`, {
      songIds,
    });
    return response.data;
  },

  async removeSongs(playlistId: UUID, songIds: UUID[]) {
    const response = await api.put(`/playlists/${playlistId}/songs/remove`, {
      songIds,
    });
    return response.data;
  },

  async getLikedBy(
    id: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<User[]>(`/playlists/${id}/liked-by`, {
      params: options,
    });
    return response.data;
  },

  async getRelatedPlaylists(
    playlistId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Playlist[]>(
      `/playlists/${playlistId}/related`,
      {
        params: options,
      }
    );
    return response.data;
  },

  async createRemixPlaylist(
    playlistId: UUID,
    userId: UUID,
    numberOfSongs: number
  ) {
    const response = await api.post<{ remixPlaylistId: UUID }>(
      `/playlists/${playlistId}/remix`,
      {
        userId,
        numberOfSongs,
      }
    );
    return response.data.remixPlaylistId;
  },
};
