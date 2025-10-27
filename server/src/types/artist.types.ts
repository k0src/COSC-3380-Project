import type { Album, Song, User, UUID } from "./index.js";

export interface Artist {
  id: UUID;
  display_name: string;
  bio: string;
  user_id: UUID;
  created_at: string;
  verified: boolean;
  profile_pic_url?: string;
  user?: User;
  songs?: Array<{ song: Song; role: string }>;
  albums?: Album[];
}

export interface SongArtist extends Artist {
  role: string;
}
