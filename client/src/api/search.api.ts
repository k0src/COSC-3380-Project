import type { Song, Album, User, Artist, Playlist, UUID } from "@types";
import api from "./api";

export interface SearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  users: User[];
  top_result?: Song | Album | Artist | Playlist | User;
}

export const searchApi = {
  async search(
    query: string,
    options?: {
      userId?: UUID;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<SearchResults>(`/search`, {
        params: {
          q: query,
          ...options,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          songs: [],
          albums: [],
          artists: [],
          playlists: [],
          users: [],
        };
      }
      throw error;
    }
  },

  async searchSongs(
    query: string,
    options?: {
      userId?: UUID;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Song[]>(`/search/songs`, {
        params: {
          q: query,
          ...options,
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

  async searchPlaylists(
    query: string,
    options?: {
      userId?: UUID;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Playlist[]>(`/search/playlists`, {
        params: {
          q: query,
          ...options,
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

  async searchArtists(
    query: string,
    options?: {
      userId?: UUID;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Artist[]>(`/search/artists`, {
        params: {
          q: query,
          ...options,
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

  async searchAlbums(
    query: string,
    options?: {
      userId?: UUID;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Album[]>(`/search/albums`, {
        params: {
          q: query,
          ...options,
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

  async searchUsers(
    query: string,
    options?: {
      userId?: UUID;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<User[]>(`/search/users`, {
        params: {
          q: query,
          ...options,
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
};
