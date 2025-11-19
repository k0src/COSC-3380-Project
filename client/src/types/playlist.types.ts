import type { UUID, User, VisibilityStatus } from "./index.js";

export interface Playlist {
  id: UUID;
  title: string;
  description: string;
  created_by: UUID;
  created_at: string;
  updated_at: string;
  visibility_status: VisibilityStatus;

  song_count?: number;
  user?: User;
  likes?: number;
  runtime?: number;
  image_url?: string;
  image_url_blurhash?: string;

  type: "playlist";
}

export interface LibraryPlaylist extends Playlist {
  is_pinned?: boolean;
  played_at?: string;
}

export type PlaylistOrderByColumn =
  | "title"
  | "created_at"
  | "likes"
  | "runtime"
  | "songCount";

export interface PlaylistOptions {
  includeUser?: boolean;
  includeLikes?: boolean;
  includeRuntime?: boolean;
  includeSongCount?: boolean;
  orderByColumn?: PlaylistOrderByColumn;
  orderByDirection?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}
