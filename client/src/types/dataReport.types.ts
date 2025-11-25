import type { UUID } from "@types";

export interface DataReportDetailColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export type TimeRange = {
  startDate: string;
  endDate: string;
};

export type Granularity = "hour" | "day" | "week" | "month";
export type CompareTo = "none" | "previous_period" | "year_ago" | "custom";

export interface KPIMetric {
  label: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  deltaPercent: number;
  trend: number[];
  isSignificant: boolean;
}

export interface ExecutiveSummary {
  timeRange: TimeRange;
  totalStreams: number;
  activeUsers: number;
  uniqueSongs: number;
  avgStreamsPerUser: number;
  engagementRate: number;
  userTrend: {
    direction: "growth" | "decline";
    percent: number;
    delta: number;
    isSignificant: boolean;
  };
  streamTrend: {
    direction: "growth" | "decline";
    percent: number;
  };
  songChange: {
    delta: number;
    percent: number;
  };
  engagementChange: {
    percent: number;
    isLarge: boolean;
  };
}

export interface ExecutiveOverviewData {
  timeRange: TimeRange;
  kpis: {
    activeUsers: KPIMetric;
    totalStreams: KPIMetric;
    uniqueSongs: KPIMetric;
    avgStreamsPerUser: KPIMetric;
    engagementRate: KPIMetric;
  };
  summary: ExecutiveSummary;
}

export interface KpisData {
  timeRange: TimeRange;
  kpis: {
    activeUsers: KPIMetric;
    totalStreams: KPIMetric;
    uniqueSongs: KPIMetric;
    avgStreamsPerUser: KPIMetric;
    engagementRate: KPIMetric;
  };
}

export interface ExecutiveSummaryData {
  timeRange: TimeRange;
  summary: ExecutiveSummary;
}

export interface UserGrowthData {
  period: string;
  newUsers: number;
  totalUsers: number;
  growthRate: number;
}

export interface RetentionCohort {
  cohortWeek: string;
  cohortSize: number;
  day1: number;
  day7: number;
  day14: number;
  day28: number;
  day90: number;
}

export interface TopTrack {
  songId: UUID;
  title: string;
  artistName: string;
  streams: number;
  uniqueListeners: number;
  growthPercent: number;
  trend: number[];
}

export interface EngagementMetrics {
  timeRange: TimeRange;
  topTracks: TopTrack[];
  concentration: {
    top1Percent: number;
    top10Percent: number;
    top50Percent: number;
  };
  averageSessionLength: number;
  story: string;
}

export interface ChurnMetrics {
  timeRange: TimeRange;
  churnRate: number;
  inactiveUsers: number;
  reactivatedUsers: number;
  avgDaysSinceLastStream: number;
  churnByPeriod: {
    period: string;
    churned: number;
    reactivated: number;
  }[];
  story: string;
}

export interface ArtistPerformance {
  artistId: UUID;
  displayName: string;
  totalStreams: number;
  uniqueListeners: number;
  avgStreamsPerListener: number;
  growthPercent: number;
  trend: number[];
}

export interface ActivityTimelineData {
  period: string;
  streams: number;
  likes: number;
  comments: number;
  followers: number;
}

export interface DetailedPeriodData {
  period: string;
  activeUsers: number;
  totalStreams: number;
  uniqueSongs: number;
  engagementRate: number;
  newUsers: number;
  topArtist: string;
  topSong: string;
}

export interface EnhancedTrackData {
  songId: string;
  title: string;
  artistName: string;
  albumTitle: string;
  streams: number;
  uniqueListeners: number;
  likes: number;
  comments: number;
  engagementRate: number;
  growthPercent: number;
  firstStreamedDate: string;
}

export interface GenreBreakdownData {
  genre: string;
  streams: number;
  uniqueListeners: number;
  percentOfTotal: number;
}

export interface UserAnalyticsData {
  userId: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  joinedAt: string;
  totalStreams: number;
  uniqueSongsPlayed: number;
  uniqueArtistsPlayed: number;
  totalLikes: number;
  totalComments: number;
  totalFollowing: number;
  totalFollowers: number;
  playlistsCreated: number;
  avgStreamsPerDay: number;
  lastActiveAt: string;
  daysSinceJoined: number;
  engagementScore: number;
}

export interface DataReportParams {
  timeRange: TimeRange;
  granularity?: Granularity;
  compareTo?: CompareTo;
  compareTimeRange?: TimeRange;
  limit?: number;
  offset?: number;
  cohortBy?: "signup_week" | "signup_month";
  retentionWindows?: number[];
  minStreams?: number;
  groupBy?: "artist" | "album" | "genre";
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  minUsers?: number;
  showSignificantChangesOnly?: boolean;
  artistFilter?: string[];
  genreFilter?: string[];
  minGrowthPercent?: number;
  minEngagementRate?: number;
  searchTerm?: string;
  artistIds?: string[];
  genres?: string[];
  albumIds?: string[];
  albumFilter?: string[];
  showOnlyNew?: boolean;
  showOnlyTrending?: boolean;
  dateRangeFilter?: TimeRange;
}
