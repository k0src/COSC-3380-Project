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
