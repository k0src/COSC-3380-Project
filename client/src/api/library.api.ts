import api from "./api";
import type {
  UUID,
  RecentlyPlayedItems,
  Song,
  Album,
  LibraryPlaylist,
  Playlist,
  LibrarySearchResults,
  Artist,
  EntityType,
} from "@types";

export const libraryApi = {
  async search(
    userId: UUID,
    q: string,
    options?: { limit?: number; offset?: number }
  ) {
    try {
      const response = await api.get<LibrarySearchResults>(
        `/users/${userId}/library/search`,
        { params: { q, ...options } }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          songs: [],
          albums: [],
          artists: [],
          playlists: [],
        };
      }
      throw error;
    }
  },

  async getRecentlyPlayed(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ) {
    try {
      const response = await api.get<RecentlyPlayedItems>(
        `/users/${userId}/library/recent`,
        { params: options }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          songs: [],
          albums: [],
          artists: [],
          playlists: [],
        };
      }
      throw error;
    }
  },

  async getLibrarySongs(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ) {
    try {
      const response = await api.get<Song[]>(`/users/${userId}/library/songs`, {
        params: options,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getLibraryPlaylists(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ) {
    try {
      const response = await api.get<LibraryPlaylist[]>(
        `/users/${userId}/library/playlists`,
        { params: options }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getLibraryArtists(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ) {
    try {
      const response = await api.get<Artist[]>(
        `/users/${userId}/library/artists`,
        {
          params: options,
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

  async getLibraryAlbums(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ) {
    try {
      const response = await api.get<Album[]>(
        `/users/${userId}/library/albums`,
        { params: options }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getSongHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    try {
      const response = await api.get<Song[]>(
        `/users/${userId}/library/history/songs`,
        { params: options }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getPlaylistHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    try {
      const response = await api.get<Playlist[]>(
        `/users/${userId}/library/history/playlists`,
        { params: options }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getArtistHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    try {
      const response = await api.get<Artist[]>(
        `/users/${userId}/library/history/artists`,
        { params: options }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getAlbumHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    try {
      const response = await api.get<Album[]>(
        `/users/${userId}/library/history/albums`,
        { params: options }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async togglePinPlaylist(userId: UUID, playlistId: UUID) {
    const response = await api.post(`/users/${userId}/library/playlists/pin`, {
      playlistId,
    });
    return response.data;
  },

  async addToHistory(userId: UUID, entityId: UUID, entityType: EntityType) {
    await api.put(`/users/${userId}/library/history`, {
      entityId,
      entityType,
    });
  },

  async clearHistory(userId: UUID) {
    const response = await api.delete(`/users/${userId}/library/history/clear`);
    return response.data;
  },

  async checkUserHasSongHistory(userId: UUID) {
    const response = await api.get<{ hasSongHistory: boolean }>(
      `/users/${userId}/library/history/has-song-history`
    );
    return response.data.hasSongHistory;
  },
};
