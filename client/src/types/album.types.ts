import type { UUID, Artist, Song } from "./index.js";

export interface Album {
  id: UUID;
  title: string;
  release_date: string;
  created_by: UUID;
  image_url?: string;
  audio_url: string;
  created_at: string;

  songs?: Array<{ song: Song; track_number: string }>;
  artist?: Artist;
  likes?: number;
  runtime?: number;
}