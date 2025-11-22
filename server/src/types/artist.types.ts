import type { OrderByDirection, User, UUID } from "@types";

export interface Artist {
  id: UUID;
  display_name: string;
  bio: string;
  user_id: UUID;
  created_at: string;
  verified: boolean;
  location?: string;
  banner_image_url?: string;
  banner_image_url_blurhash?: string;
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

export type ArtistOrderByColumn =
  | "display_name"
  | "created_at"
  | "verified"
  | "streams";

export interface ArtistOptions {
  includeUser?: boolean;
  orderByColumn?: ArtistOrderByColumn;
  orderByDirection?: OrderByDirection;
  limit?: number;
  offset?: number;
}
