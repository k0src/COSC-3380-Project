import type { UUID, Album, Artist } from "./index.js";

// Main Song type
export interface Song {
  id: UUID;
  title: string;
  duration: number;
  genre: string;
  release_date: number;
  image_url?: string;
  audio_url: string;
  created_at: string;

  // Related fields
  album?: Album;
  artists?: Artist[];
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

// Form data from client
// Release date is optional - [now] if not included
// Seems like not enough, but all the other fields are generated
// or files
export interface SongData {
  title: string;
  genre: string;
  release_date?: string;
}

// Files from client
// Sent to backend via form & Multer
// Image is optional, but audio is REQUIRED
export interface SongFiles {
  image?: Express.Multer.File;
  audio: Express.Multer.File;
}
