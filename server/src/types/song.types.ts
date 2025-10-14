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

// THIS NEEDS TO INCLUDE ARTISTS AND ALBUM!!!
// Form data from client
export interface SongData {
  title?: string;
  genre?: string;
  duration?: number;
  release_date?: string;
  image_url?: string; // file in blob storage (i.e., [uuid]-cover.jpg)
  audio_url?: string; // file in to blob storage (i.e., [uuid]-audio.mp3)
}
