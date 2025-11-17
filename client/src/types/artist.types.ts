import type { User, UUID } from "./index.js";

export interface Artist {
  id: UUID;
  display_name: string;
  bio: string;
  user_id: UUID;
  created_at: string;
  verified: boolean;
  streams: number;
  location?: string;
  banner_image_url?: string;
  banner_image_url_blurhash?: string;
  follower_count?: number;
  stream_count?: number;  
  user?: User;

  type: "artist";
}

export interface SongArtist extends Artist {
  role: string;
}

export interface LibraryArtist extends Artist {
  played_at?: string;
}
