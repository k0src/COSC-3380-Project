import type { UUID } from "@types";

export type NotificationType =
  | "LIKE"
  | "COMMENT"
  | "MENTION"
  | "FOLLOW"
  | "TRENDING"
  | "STATS"
  | "ALERT"
  | "INFO"
  | "DANGER";

export interface Notification {
  id: UUID;
  user_id: UUID;
  notification_text: string;
  links?: {
    url: string;
    text?: string;
  };
  notified_at: string;
  is_read: boolean;
  read_at?: string;
  type: NotificationType;
}
