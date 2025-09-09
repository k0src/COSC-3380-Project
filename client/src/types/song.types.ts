import type { UUID } from "./index.js";

export interface Song {
  id: UUID;
  title: string;
  release_year: number;
  image_url: string;
  audio_url: string;
  created_at: string;
}
