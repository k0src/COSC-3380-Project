import type { UUID } from "./index.js";

export interface Song {
  id: UUID;
  title: string;
  release_year: number;
  created_at: string;
}
