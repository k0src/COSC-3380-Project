import type { UUID } from "@types";

// Time range and granularity
export type TimeRange = {
  startDate: string;
  endDate: string;
};

export type Granularity = "hour" | "day" | "week" | "month";
export type CompareTo = "none" | "previous_period" | "year_ago" | "custom";

// Executive Overview Types
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
  topAnomalies: Array<{
    date: string;
    metric: string;
    value: number;
    zScore: number;
    severity: "high" | "moderate";
  }>;
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
  anomalies: Anomaly[];
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

export interface AnomaliesData {
  timeRange: TimeRange;
  anomalies: Anomaly[];
}

export interface Anomaly {
  date: string;
  metric: string;
  value: number;
  zScore: number;
  description: string;
}

// User Growth & Retention Types
export interface UserGrowthData {
  period: string;
  newUsers: number;
  totalUsers: number;
  growthRate: number;
}

export interface RetentionData {
  cohort: string;
  cohortSize: number;
  retention: {
    [day: string]: number;
  };
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

export interface UserGrowthMetrics {
  timeRange: TimeRange;
  growthData: UserGrowthData[];
  retentionCohorts: RetentionCohort[];
  averageTimeToFirstStream: number;
}

// Listening & Engagement Types
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

// Moderation Analytics Types
export interface ModerationMetrics {
  timeRange: TimeRange;
  totalReports: number;
  resolvedReports: number;
  dismissedReports: number;
  pendingReports: number;
  avgResolutionTime: number;
  actionRate: number;
  reportsByType: {
    type: string;
    count: number;
  }[];
  story: string;
}

export interface RepeatOffender {
  userId: UUID;
  username: string;
  reportCount: number;
  invalidCount: number;
  validCount: number;
  lastReportedAt: string;
}

// Content Health Types
export interface ContentHealthMetrics {
  timeRange: TimeRange;
  totalSongs: number;
  songsWithMetadata: number;
  songsWithCover: number;
  metadataCompletenessScore: number;
  story: string;
}

// Playlist Health Types
export interface PlaylistHealthMetrics {
  timeRange: TimeRange;
  totalPlaylists: number;
  averagePlaylistSize: number;
  averageEngagementRate: number;
  story: string;
}

// Artist Performance Types
export interface ArtistPerformance {
  artistId: UUID;
  displayName: string;
  totalStreams: number;
  uniqueListeners: number;
  avgStreamsPerListener: number;
  growthPercent: number;
  trend: number[];
}

// Activity Timeline Types
export interface ActivityTimelineData {
  period: string;
  streams: number;
  likes: number;
  comments: number;
  followers: number;
}

// Detailed Table Data Types
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

export type DetailedPeriodDataResponse = DetailedPeriodData[];

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

export interface TimeToFirstStreamDistribution {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  buckets: {
    label: string;
    count: number;
  }[];
}

export interface ParetoDataPoint {
  songPercentile: number;
  cumulativeStreamPercent: number;
  songTitle?: string;
  streams?: number;
}

export interface EngagementTimeSeriesData {
  period: string;
  likes: number;
  comments: number;
  streams: number;
  engagementRate: number;
}

// Enhanced Cohort Data
export interface DetailedCohortData {
  cohortWeek: string;
  cohortSize: number;
  day1Retention: number;
  day7Retention: number;
  day14Retention: number;
  day28Retention: number;
  day90Retention: number;
  churnRate: number;
  avgStreamsPerUser: number;
  engagementRate: number;
}

// Enhanced Track Data
export interface EnhancedTrackData {
  songId: UUID;
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

// Genre Breakdown Data
export interface GenreBreakdownData {
  genre: string;
  streams: number;
  uniqueListeners: number;
  percentOfTotal: number;
}

// User Analytics Data
export interface UserAnalyticsData {
  userId: UUID;
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

// Parameters
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
  // New detailed table parameters
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  minUsers?: number;
  showSignificantChangesOnly?: boolean;
  artistFilter?: string[];
  genreFilter?: string[];
  minGrowthPercent?: number;
  minEngagementRate?: number;
  // Advanced filter parameters for Task 5.9
  searchTerm?: string;
  artistIds?: string[];
  genres?: string[];
  albumIds?: string[];
  albumFilter?: string[];
  showOnlyNew?: boolean;
  showOnlyTrending?: boolean;
  dateRangeFilter?: TimeRange;
}
