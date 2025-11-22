import type { UUID, OrderByDirection } from "./index.js";

export type UserRole = "USER" | "ARTIST" | "ADMIN";
export type UserStatus = "ACTIVE" | "DEACTIVATED" | "SUSPENDED";

export interface User {
  id: UUID;
  username: string;
  email: string;
  password_hash?: string;
  authenticated_with: string;
  role: UserRole;
  profile_picture_url?: string;
  pfp_blurhash?: string;
  artist_id?: UUID;
  status: UserStatus;
  is_private: boolean;
  updated_at: string;
  created_at: string;

  following_count?: number;
  follower_count?: number;
}

export interface UserSettings {
  user_id: UUID;
  release_notifications: boolean;
  playlist_like_notifications: boolean;
  follower_notifications: boolean;
  comment_tag_notifications: boolean;
  color_scheme: string;
  color_theme: string;
  zoom_level: number;
  artist_like_notifications: boolean;
  song_comment_notifications: boolean;
  songs_discoverable: boolean;
  created_at: string;
  updated_at: string;
}

export type UserOrderByColumn = "username" | "role" | "created_at";

export interface UserOptions {
  includeFollowerCount?: boolean;
  includeFollowingCount?: boolean;
  orderByColumn?: UserOrderByColumn;
  orderByDirection?: OrderByDirection;
  limit?: number;
  offset?: number;
}
