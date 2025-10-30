import type { UUID, Song, User } from "./index.js";

export interface Playlist {
  id: UUID;
  title: string;
  description: string;
  created_by: UUID;
  created_at: string;

  song_count?: number;
  user?: User;
  likes?: number;
}
