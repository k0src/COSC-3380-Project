import type { Song, Album, User, Artist, Playlist } from "@types";
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
  async search(query: string, options?: { ownerId?: string }) {
    const response = await api.get<SearchResults>(`/search`, {
      params: {
        q: query,
        ...options,
      },
    });
    return response.data;
  },

  async searchUsers(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<User[]>(`/search/users`, {
      params: {
        q: query,
        ...options,
      },
    });
    return response.data;
  },

  async searchSongs(
    query: string,
    options?: {
      ownerId?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Song[]>(`/search/songs`, {
      params: {
        q: query,
        ...options,
      },
    });
    return response.data;
  },

  async searchAlbums(
    query: string,
    options?: {
      ownerId?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Album[]>(`/search/albums`, {
      params: {
        q: query,
        ...options,
      },
    });
    return response.data;
  },

  async searchPlaylists(
    query: string,
    options?: {
      ownerId?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Playlist[]>(`/search/playlists`, {
      params: {
        q: query,
        ...options,
      },
    });
    return response.data;
  },

  async searchArtists(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Artist[]>(`/search/artists`, {
      params: {
        q: query,
        ...options,
      },
    });
    return response.data;
  },
};
