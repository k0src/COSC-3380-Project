import type {
  UUID,
  Album,
  SongArtist,
  Artist,
  VisibilityStatus,
} from "./index.js";

// Main Song type
export interface Song {
  id: UUID;
  created_by: UUID;
  title: string;
  duration: number;
  genre: string;
  release_date: string;
  image_url?: string;
  image_url_blurhash?: string;
  audio_url: string;
  created_at: string;
  streams?: number;
  visibility_status: VisibilityStatus;

  albums?: Album[];
  artists?: SongArtist[];
  likes?: number;
  comments?: number;

  type: "song";
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

export interface SuggestedSong extends Song {
  total_score: number;
  main_artist: Artist;
}

export interface LibrarySong extends Song {
  played_at?: string;
}
