import api from "./api";
import type { ArtistSong, UUID } from "@types";

export const artistApi = {
  async getSongs(
    id: UUID,
    options?: {
      includeAlbum?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
      includeComments?: boolean;
      orderByColumn?:
        | "title"
        | "created_at"
        | "streams"
        | "release_date"
        | "likes"
        | "comments"
        | "duration";
      orderByDirection?: "ASC" | "DESC";
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<ArtistSong[]>(`/artists/${id}/songs`, {
      params: options,
    });
    return response.data;
  },

  async getAlbums(
    id: UUID,
    options?: {
      includeLikes?: boolean;
      includeRuntime?: boolean;
      includeSongCount?: boolean;
      orderByColumn?:
        | "title"
        | "created_at"
        | "release_date"
        | "likes"
        | "runtime"
        | "songCount";
      orderByDirection?: "ASC" | "DESC";
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<ArtistSong[]>(`/artists/${id}/albums`, {
      params: options,
    });
    return response.data;
  },

  async getRelatedArtists(
    id: UUID,
    options?: {
      includeUser?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<ArtistSong[]>(`/artists/${id}/related`, {
      params: options,
    });
    return response.data;
  },
};
