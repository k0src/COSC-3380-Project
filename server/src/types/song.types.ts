import type { UUID, Album, Artist } from "./index.js";

export interface Song {
  id: UUID;
  title: string;
  duration: number;
  genre: string;
  release_date: number;
  image_url?: string;
  audio_url: string;
  created_at: string;

  album?: Album;
  artists?: Artist[];
  likes?: number;
}

export interface PlaylistSong extends Song {
  added_at: string;
}

export interface AlbumSong extends Song {
  track_number: number;
}

export interface ArtistSong extends Song {
  role: string;
}
