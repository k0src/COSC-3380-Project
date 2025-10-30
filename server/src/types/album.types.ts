import type { UUID, Artist } from "./index.js";

export interface Album {
  id: UUID;
  title: string;
  release_date: string;
  created_by: UUID;
  image_url?: string;
  audio_url: string;
  created_at: string;

  song_count?: number;
  artist?: Artist;
  likes?: number;
  runtime?: number;
}
