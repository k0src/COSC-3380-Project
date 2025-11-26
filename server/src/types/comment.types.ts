import type { UUID } from "@types";

export interface Comment {
  id: UUID;
  comment_text: string;
  user_id: UUID;
  song_id: UUID;
  username: string;
  profile_picture_url: string;
  commented_at: string;
  song_title?: string;

  likes?: number;

  tags?: Array<{
    user_id: string;
    username: string;
    start: number;
    end: number;
  }>;
}

export type CommentOrderByColumn = "likes" | "commented_at";
