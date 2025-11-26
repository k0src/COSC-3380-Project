import api from "./api";
import type {
  Album,
  AlbumSong,
  UUID,
  User,
  AccessContext,
  AlbumOrderByColumn,
  OrderByDirection,
} from "@types";

export const albumApi = {
  async create(data: {
    title: string;
    owner_id: UUID;
    genre: string;
    release_date: string;
    visibility_status: string;
    created_by: UUID;
    image?: File | null;
  }) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    const response = await api.post<Album>("/albums", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async update(
    albumId: UUID,
    data: {
      owner_id: UUID;
      title?: string;
      genre?: string;
      release_date?: string;
      visibility_status?: string;
      image?: File | null;
    }
  ) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const response = await api.put<Album>(`/albums/${albumId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async delete(albumId: UUID) {
    const response = await api.delete(`/albums/${albumId}`);
    return response.data;
  },

  async bulkDelete(albumIds: UUID[]) {
    const response = await api.post(`/albums/bulk-delete`, { albumIds });
    return response.data;
  },

  async getAlbumDetails(albumId: UUID, accessContext: AccessContext) {
    try {
      const response = await api.get<Album>(`/albums/${albumId}`, {
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

  async getManyAlbums(
    accessContext: AccessContext,
    options?: {
      orderByColumn?: AlbumOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Album[]>(`/albums`, {
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
    albumId: UUID,
    accessContext: AccessContext,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<AlbumSong[]>(`/albums/${albumId}/songs`, {
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

  async removeSong(albumId: UUID, songId: UUID) {
    const response = await api.delete(`/albums/${albumId}/songs/${songId}`);
    return response.data;
  },

  async addSong(albumId: UUID, songId: UUID, trackNumber: number) {
    const response = await api.post(`/albums/${albumId}/songs`, {
      songId,
      trackNumber,
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
    const response = await api.get<User[]>(`/albums/${id}/liked-by`, {
      params: options,
    });
    return response.data;
  },

  async getRelatedAlbums(
    id: UUID,
    options?: {
      orderByColumn?: AlbumOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Album[]>(`/albums/${id}/related`, {
      params: options,
    });
    return response.data;
  },
};
