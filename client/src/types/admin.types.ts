import type { UUID, ReportableEntityType } from "@types";

export interface AdminDashboardStats {
  totalUsers: number;
  totalSongs: number;
  totalAlbums: number;
  totalPlaylists: number;
  totalStreams: number;
  totalArtists: number;
  activeUsers: number;
  pendingReports: number;
}

export interface AdminUserGrowthData {
  date: string;
  count: number;
}

export interface PlatformActivity {
  date: string;
  songs: number;
  albums: number;
  playlists: number;
}

export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";
export type CoverEntityType = "song" | "playlist" | "album";

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
