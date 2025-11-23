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
  reported_entity_type?: ReportEntity; // which entity type was reported
  resolved_at?: string | null;
  metadata?: any | null;
  entity_name?: string; // optional joined data (deprecated - prefer reported_name)
  reporter_username?: string; // username of the person who made the report
  reported_name?: string; // username/title of the person/item being reported
};