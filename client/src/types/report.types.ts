import type { UUID } from "@types";

export type ReportableEntityType = "user" | "album" | "song" | "playlist";
export type ReportType = "EXPLICIT" | "VIOLENT" | "HATEFUL" | "COPYRIGHT";
export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";
export type ReportOrderByColumn =
  | "reported_at"
  | "report_type"
  | "report_status";
export type AppealOrderByColumn = "submitted_at" | "appeal_status";

export interface Report {
  id: UUID;
  reporter_id: UUID;
  reported_id: UUID;
  reported_at: string;
  report_type: string;
  description: string;
  report_status: ReportStatus;
  reviewer_id: UUID | null;
  reporter_username: string;
  reported_name: string;
  entity_type: ReportableEntityType;
}

export interface Appeal {
  id: UUID;
  user_id: UUID;
  entity_id: UUID;
  submitted_at: string;
  reason: string;
  appeal_status: ReportStatus;
  reviewer_id: UUID | null;
  username: string;
  entity_name: string;
  entity_type: ReportableEntityType;
}
