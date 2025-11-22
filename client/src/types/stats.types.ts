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
  [key: string]: string | number;
}

export interface ArtistTopSongsChartData {
  title: string;
  streams: number;
  fill: string;
  [key: string]: string | number;
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
