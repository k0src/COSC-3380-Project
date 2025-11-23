import type { UUID } from "@types";

export type ReportEntity =
  | "USER"
  | "ARTIST"
  | "ALBUM"
  | "SONG"
  | "PLAYLIST";

export type ReportType = "EXPLICIT" | "VIOLENT" | "HATEFUL" | "COPYRIGHT";

export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";

export type Report = {
  report_id: UUID;
  reporter_id: UUID;
  reported_id: UUID;
  report_type: string;
  description: string;
  report_result?: "suspend" | "reject" | null;
  report_status: string;
  created_at: string;
  reviewer_id?: UUID | null;
  entity_name?: string; // optional joined data
  reporter_username?: string; // username of the person who made the report
  reported_name?: string; // username of the person being reported
};