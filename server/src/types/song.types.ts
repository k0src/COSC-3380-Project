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

export interface SongComment {
  user_id: UUID;
  username: string;
  profile_picture_url: string;
  comment_text: string;
  commented_at: string;
}
