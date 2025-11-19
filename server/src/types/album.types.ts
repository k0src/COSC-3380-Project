import type {
  UUID,
  Artist,
  VisibilityStatus,
  OrderByDirection,
} from "./index.js";

export interface Album {
  id: UUID;
  owner_id: UUID;
  title: string;
  release_date: string;
  created_by: UUID;
  image_url?: string;
  image_url_blurhash?: string;
  created_at: string;
  updated_at: string;
  genre: string;
  visibility_status: VisibilityStatus;

  song_count?: number;
  artist?: Artist;
  likes?: number;
  runtime?: number;
  song_ids?: UUID[];

  type: "album";
}

export interface LibraryAlbum extends Album {
  played_at?: string;
}

export type AlbumOrderByColumn =
  | "title"
  | "created_at"
  | "release_date"
  | "likes"
  | "runtime"
  | "songCount";

export interface AlbumOptions {
  includeArtist?: boolean;
  includeLikes?: boolean;
  includeRuntime?: boolean;
  includeSongCount?: boolean;
  includeSongIds?: boolean;
  orderByColumn?: AlbumOrderByColumn;
  orderByDirection?: OrderByDirection;
  limit?: number;
  offset?: number;
}
