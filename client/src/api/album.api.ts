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
};
