import type { UUID, UserRole, UserStatus } from "./index.js";

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
