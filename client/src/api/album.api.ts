import api from "./api";
import type { Album, AlbumSong, UUID, User } from "@types";

export const albumApi = {
  async getAlbumById(
    id: UUID,
    options?: {
      includeArtist?: boolean;
      includeLikes?: boolean;
      includeSongCount?: boolean;
      includeRuntime?: boolean;
      includeSongIds?: boolean;
    }
  ) {
    const response = await api.get(`/albums/${id}`, {
      params: options,
    });
    return response.data;
  },

  async getSongs(
    id: UUID,
    options?: {
      includeArtists?: boolean;
      includeLikes?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<AlbumSong[]>(`/albums/${id}/songs`, {
      params: options,
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
      includeArtist?: boolean;
      includeLikes?: boolean;
      includeSongCount?: boolean;
      includeRuntime?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Album[]>(`/albums/${id}/related`, {
      params: options,
    });
    return response.data;
  },

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
      title?: string;
      genre?: string;
      release_date?: string;
      visibility_status?: string;
      created_by?: UUID;
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
};
