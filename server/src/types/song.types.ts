import type { UUID, Album, Artist } from "./index.js";

export interface Song {
  id: UUID;
  title: string;
  duration: number;
  album_id?: UUID;
  release_date: number;
  image_url?: string;
  audio_url: string;
  created_at: string;

  album?: Album;
  artists?: Artist[];
  likes?: {
    liked_by: UUID[];
    total: number;
  };
  comments?: {
    user_id: UUID;
    comment_text: string;
    username: string;
    profile_picture_url?: string;
  }[];
}
