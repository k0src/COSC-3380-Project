import type { User } from "@types";

export interface WeeklyPlays {
  weeks: string[];
  plays: number[];
}

export interface TopListener extends User {
  streams: number;
  top_song_title: string;
}

export interface ArtistAllTimeStats {
  streams: number;
  likes: number;
  comments: number;
  unique_listeners: number;
  total_songs: number;
}

export interface StreamsBarChartData {
  month: string;
  streams: number;
  likes: number;
}

export interface ListenersPieChartData {
  label: string;
  value: number;
  color: string;
}

export interface FollowerData {
  followers: number[];
  dates: string[];
}

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

export interface ArtistQuickStats {
  listeners: number;
  streams: number;
  newFollowers: number;
  playlistAdds: number;
}
