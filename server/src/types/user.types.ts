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

  playlists?: Playlist[];

  following?: User[];
  followers?: User[];
  following_count?: number;
  followers_count?: number;
}
