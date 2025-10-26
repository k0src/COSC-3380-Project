import api from "./api";
import type { Artist, ArtistSong, Song, UUID, Album } from "../types";

export const artistApi = {

  async getArtists(id?: string, options?: {
  includeUser?: boolean;
  limit?: number;
  offset?: number;
}) {
    // Calls GET /artists
    const response = await api.get<Artist[]>("/artists", {
      params: options,
    });
    return response.data;
  },

  
  // --- New Function Added ---
  async getArtistById(
    id: UUID,
    options?: {
      includeUser?: boolean;
    }
  ) {
    // Calls GET /artists/:id
    const response = await api.get<Artist>(`artists/${id}`, {
      params: options,
    });
    return response.data;
  },
  // --------------------------

  async getSongs(
    id: UUID,
    options?: {
      includeAlbum?: boolean;
      includeLikes?: boolean;
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
      limit?: number;
      offset?: number;
    }
  ) {
    // Calls GET /artists/:id/albums
    const response = await api.get<Album[]>(`/artists/${id}/albums`, {
      params: options,
    });
    return response.data;
  },


};