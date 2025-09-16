import type { UUID } from "./index.js";

export interface Album {
  id: UUID;
  title: string;
  release_date: number;
  created_by: UUID;
  image_url?: string;
  audio_url: string;
  created_at: string;
}
