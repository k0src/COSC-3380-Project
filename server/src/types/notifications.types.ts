import type { UUID } from "@types";

export interface Notification {
  user_id: UUID;
  notification_text: string;
  links?: {
    url: string;
    text?: string;
  };
  notified_at: string;
  is_read: boolean;
  read_at?: string;
}
