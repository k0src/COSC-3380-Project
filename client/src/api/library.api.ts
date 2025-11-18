import api from "./api";
import type {
  UUID,
  RecentlyPlayedItems,
  Song,
  Album,
  LibraryPlaylist,
  LibrarySearchResults,
  Artist,
  RecentlyPlayedItemsArray,
} from "@types";

export const libraryApi = {
  async search(userId: UUID, q: string) {
    const response = await api.get<LibrarySearchResults>(
      `/users/${userId}/library/search`,
      {
        params: { q },
      }
    );
    return response.data;
  },

  async getRecentlyPlayed(userId: UUID, maxItems: number) {
    const response = await api.get<RecentlyPlayedItems>(
      `/users/${userId}/library/recent`,
      {
        params: { maxItems },
      }
    );
    return response.data;
  },

  async getRecentlyPlayedArray(userId: UUID, maxItems: number) {
    const response = await api.get<RecentlyPlayedItemsArray>(
      `/users/${userId}/library/recent`,
      {
        params: { maxItems, array: true },
      }
    );
    return response.data;
  },

  async getLibraryPlaylists(
    userId: UUID,
    options?: { limit?: number; offset?: number; omitLikes?: boolean }
  ) {
    const response = await api.get<LibraryPlaylist[]>(
      `/users/${userId}/library/playlists`,
      {
        params: options,
      }
    );
    return response.data;
  },

  async getLibraryAlbums(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ) {
    const response = await api.get<Album[]>(`/users/${userId}/library/albums`, {
      params: options,
    });
    return response.data;
  },

  async getLibrarySongs(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ) {
    const response = await api.get<Song[]>(`/users/${userId}/library/songs`, {
      params: options,
    });
    return response.data;
  },

  async getLibraryArtists(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ) {
    const response = await api.get<Artist[]>(
      `/users/${userId}/library/artists`,
      {
        params: options,
      }
    );
    return response.data;
  },

  async getSongHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    const response = await api.get<Song[]>(
      `/users/${userId}/library/history/songs`,
      {
        params: options,
      }
    );
    return response.data;
  },

  async getAlbumHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    const response = await api.get<Album[]>(
      `/users/${userId}/library/history/albums`,
      {
        params: options,
      }
    );
    return response.data;
  },

  async getPlaylistHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    const response = await api.get<LibraryPlaylist[]>(
      `/users/${userId}/library/history/playlists`,
      {
        params: options,
      }
    );
    return response.data;
  },

  async getArtistHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    const response = await api.get<Artist[]>(
      `/users/${userId}/library/history/artists`,
      {
        params: options,
      }
    );
    return response.data;
  },

  async togglePinPlaylist(userId: UUID, playlistId: UUID) {
    const response = await api.post(`/users/${userId}/library/playlists/pin`, {
      playlistId,
    });
    return response.data;
  },
};
