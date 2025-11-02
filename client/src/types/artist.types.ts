import type { User, UUID } from "./index.js";

export interface Artist {
  id: UUID;
  display_name: string;
  bio: string;
  user_id: UUID;
  created_at: string;
  verified: boolean;
  streams: number;

  user?: User;

  type: "artist";
}

export interface SongArtist extends Artist {
  role: string;
}
