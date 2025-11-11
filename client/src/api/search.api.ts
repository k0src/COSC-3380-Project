import api from "./api";

export type SearchArtist = {
  id: string | number;
  name: string;
  bio?: string | null;
  image: string;
  likes?: number;
  comments?: number;
  plays?: number;
};

export type SearchSongArtist = {
  id: string | number;
  name: string;
};

export type SearchSong = {
  id: string | number;
  title: string;
  image: string;
  genre?: string;
  artists?: SearchSongArtist[];
  artist?: string;
};

export type SearchAlbum = {
  title: string;
  image: string;
  artist: string;
  plays?: number;
  likes?: number;
  comments?: number;
};

export type SearchPlaylist = {
  title: string;
  description?: string;
  artist: string;
  image: string;
  plays?: number;
  likes?: number;
  comments?: number;
};

export type SearchResponse = {
  songs?: SearchSong[];
  artists?: SearchArtist[];
  albums?: SearchAlbum[];
  playlists?: SearchPlaylist[];
};

export async function fetchSearch(
  q: string,
  type: "all" | "songs" | "artists" | "albums" | "playlists" = "all",
  limit = 20,
  offset = 0
): Promise<SearchResponse> {
  const res = await api.get("/search", {
    params: { q, type, limit, offset },
  });
  return res.data as SearchResponse;
}


