import type { UUID, Song, User } from "./index.js";

export interface Playlist {
  id: UUID;
  title: string;
  description: string;
  created_by: UUID;
  created_at: string;
  updated_at: string;
  visibility_status: string;

  song_count?: number;
  user?: User;
  likes?: number;
  runtime?: number;
  image_url?: string;

  type: "playlist";
}

export interface LibraryPlaylist extends Playlist {
  is_pinned?: boolean;
  played_at?: string;
}
