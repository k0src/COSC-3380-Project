import type { UUID, User } from "./index.js";

export interface Playlist {
  id: UUID;
  title: string;
  description: string;
  created_by: UUID;
  created_at: string;

  user?: User;
  likes?: number;
}