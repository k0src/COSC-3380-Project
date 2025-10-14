import type { UUID, Album, SongArtist } from "./index.js";

// Main Song type
export interface Song {
  id: UUID;
  title: string;
  duration: number;
  genre: string;
  release_date: string;
  image_url?: string;
  audio_url: string;
  created_at: string;

  // Related fields
  album?: Album;
  artists?: SongArtist[];
  likes?: number;
}

// Extended types with additional fields for specifc contexts
export interface PlaylistSong extends Song {
  added_at: string;
}

export interface AlbumSong extends Song {
  track_number: number;
}

export interface ArtistSong extends Song {
  role: string;
}
