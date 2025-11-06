import api from "./api";

export type SearchType = "all" | "songs" | "artists" | "albums" | "playlists";

export interface SearchSongArtistRef {
  id: string | number;
  name: string;
}

export interface SearchSong {
  id: string | number;
  title: string;
  image: string;
  // Optional fields depending on API response
  artist?: string;
  artists?: SearchSongArtistRef[];
  plays?: number;
  likes?: number;
  comments?: number;
  duration?: number;
}

export interface SearchArtist {
  id: string | number;
  name: string;
  image: string;
  plays?: number;
  likes?: number;
  comments?: number;
}

export interface SearchAlbum {
  id: string | number;
  title: string;
  artist: string;
  image: string;
  release_date?: string;
  plays?: number;
  likes?: number;
  comments?: number;
}

export interface SearchPlaylist {
  id: string | number;
  title: string;
  artist: string;
  image: string;
  plays?: number;
  likes?: number;
  comments?: number;
}

export interface SearchResponse {
  songs?: SearchSong[];
  artists?: SearchArtist[];
  albums?: SearchAlbum[];
  playlists?: SearchPlaylist[];
}

export async function fetchSearch(
  q: string,
  type: SearchType = "all",
  limit = 20,
  offset = 0
): Promise<SearchResponse> {
  const params = { q, type, limit, offset };
  const { data } = await api.get<SearchResponse>(`/search`, { params });
  return data;
}
