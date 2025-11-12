import type { Song, Album, User, Artist, Playlist } from "@types";
import api from "./api";

export interface SearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  users: User[];
}

export const searchApi = {
  async search(query: string) {
    const response = await api.get<SearchResults>(`/search`, {
      params: { q: query },
    });
    return response.data;
  },

  async searchUsers(query: string) {
    const response = await api.get<User[]>(`/search/users`, {
      params: { q: query },
    });
    return response.data;
  },

  async searchSongs(query: string) {
    const response = await api.get<Song[]>(`/search/songs`, {
      params: { q: query },
    });
    return response.data;
  },

  async searchAlbums(query: string) {
    const response = await api.get<Album[]>(`/search/albums`, {
      params: { q: query },
    });
    return response.data;
  },

  async searchPlaylists(query: string) {
    const response = await api.get<Playlist[]>(`/search/playlists`, {
      params: { q: query },
    });
    return response.data;
  },

  async searchArtists(query: string) {
    const response = await api.get<Artist[]>(`/search/artists`, {
      params: { q: query },
    });
    return response.data;
  },
};