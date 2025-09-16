import type { UUID } from "./index.js";

export interface Song {
  id: UUID;
  title: string;
  duration: number;
  album_id: UUID | null;
  release_date: number;
  image_url: string | null;
  audio_url: string;
  created_at: string;
}
