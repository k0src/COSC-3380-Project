import api from "./api";
import type { PlaylistSong, Playlist, UUID, User } from "@types";

export const playlistApi = {
  async getPlaylistById(
    id: UUID,
    options?: {
      includeUser?: boolean;
      includeLikes?: boolean;
      includeSongCount?: boolean;
      includeRuntime?: boolean;
    }
  ) {
    const response = await api.get<Playlist>(`/playlists/${id}`, {
      params: options,
    });
    return response.data;
  },

  async getSongs(
    id: UUID,
    options?: {
      includeAlbums?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<PlaylistSong[]>(`/playlists/${id}/songs`, {
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
    const response = await api.get<User[]>(`/playlists/${id}/liked-by`, {
      params: options,
    });
    return response.data;
  },

  async getRelatedPlaylists(
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
    const response = await api.get<Playlist[]>(`/playlists/${id}/related`, {
      params: options,
    });
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

  async create(data: {
    created_by: UUID;
    title: string;
    description?: string;
    is_public: boolean;
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
};
