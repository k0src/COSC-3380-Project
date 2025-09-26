import type { UUID, UserRole, Playlist } from "./index.js";

export interface User {
  id: UUID;
  username: string;
  email: string;
  password_hash?: string;
  authenticated_with: string;
  role: UserRole;
  profile_picture_url?: string;
  artist_id?: UUID;
  created_at: string;

  following_count?: number;
  follower_count?: number;
}
