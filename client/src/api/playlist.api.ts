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
};
