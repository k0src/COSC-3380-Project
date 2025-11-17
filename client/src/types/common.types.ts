export type UUID = string;
export type UserRole = "USER" | "ARTIST" | "ADMIN";
export type EntityType = "song" | "album" | "artist" | "playlist" | "comment";
export type UserStatus = "ACTIVE" | "DEACTIVATED" | "SUSPENDED";
export type VisibilityStatus = "PUBLIC" | "PRIVATE" | "UNLISTED";

export interface Comment {
  id: UUID;
  comment_text: string;
  user_id: UUID;
  song_id: UUID;
  username: string;
  profile_picture_url: string;
  commented_at: string;

  likes?: number;

  tags?: Array<{
    user_id: string;
    username: string;
    start: number;
    end: number;
  }>;
}
