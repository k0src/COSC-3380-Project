import type { UUID } from "@types";

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

export interface UserGrowthData {
  date: string;
  count: number;
}

export interface PlatformActivity {
  date: string;
  songs: number;
  albums: number;
  playlists: number;
}

export interface RecentReport {
  reporter_id: UUID;
  reported_id: UUID;
  reported_at: string;
  report_type: string;
  description: string;
  report_status: string;
  reporter_username: string;
  reported_username: string;
}
