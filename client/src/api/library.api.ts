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
  AccessContext,
} from "@types";

export const libraryApi = {
  async search(userId: UUID, accessContext: AccessContext, q: string) {
    const response = await api.get<LibrarySearchResults>(
      `/users/${userId}/library/search`,
      {
        params: {
          q,
          role: accessContext.role,
          userId: accessContext.userId,
          scope: accessContext.scope,
        },
      }
    );
    return response.data;
  },

  async getRecentlyPlayed(
    userId: UUID,
    accessContext: AccessContext,
    maxItems: number
  ) {
    const response = await api.get<RecentlyPlayedItems>(
      `/users/${userId}/library/recent`,
      {
        params: {
          maxItems,
          role: accessContext.role,
          userId: accessContext.userId,
          scope: accessContext.scope,
        },
      }
    );
    return response.data;
  },

  async getRecentlyPlayedArray(
    userId: UUID,
    accessContext: AccessContext,
    maxItems: number
  ) {
    const response = await api.get<RecentlyPlayedItemsArray>(
      `/users/${userId}/library/recent`,
      {
        params: {
          maxItems,
          array: true,
          role: accessContext.role,
          userId: accessContext.userId,
          scope: accessContext.scope,
        },
      }
    );
    return response.data;
  },

  async getLibraryPlaylists(
    userId: UUID,
    accessContext: AccessContext,
    options?: { limit?: number; offset?: number; omitLikes?: boolean }
  ) {
    const response = await api.get<LibraryPlaylist[]>(
      `/users/${userId}/library/playlists`,
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
  },

  async getLibraryAlbums(
    userId: UUID,
    accessContext: AccessContext,
    options?: { limit?: number; offset?: number }
  ) {
    const response = await api.get<Album[]>(`/users/${userId}/library/albums`, {
      params: {
        ...options,
        role: accessContext.role,
        userId: accessContext.userId,
        scope: accessContext.scope,
      },
    });
    return response.data;
  },

  async getLibrarySongs(
    userId: UUID,
    accessContext: AccessContext,
    options?: { limit?: number; offset?: number }
  ) {
    const response = await api.get<Song[]>(`/users/${userId}/library/songs`, {
      params: {
        ...options,
        role: accessContext.role,
        userId: accessContext.userId,
        scope: accessContext.scope,
      },
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
    accessContext: AccessContext,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    const response = await api.get<Song[]>(
      `/users/${userId}/library/history/songs`,
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
  },

  async getAlbumHistory(
    userId: UUID,
    accessContext: AccessContext,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    const response = await api.get<Album[]>(
      `/users/${userId}/library/history/albums`,
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
  },

  async getPlaylistHistory(
    userId: UUID,
    accessContext: AccessContext,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ) {
    const response = await api.get<LibraryPlaylist[]>(
      `/users/${userId}/library/history/playlists`,
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

  async clearHistory(userId: UUID) {
    const response = await api.delete(`/users/${userId}/library/history/clear`);
    return response.data;
  },
};
