import api from "./api";
import type {
  DataReportParams,
  ExecutiveOverviewData,
  UserGrowthMetrics,
  EngagementMetrics,
  ModerationMetrics,
  ContentHealthMetrics,
  ActivityTimelineData,
  KpisData,
  AnomaliesData,
  ExecutiveSummaryData,
  RetentionCohort,
  UserGrowthData,
  DetailedPeriodData,
  ExecutiveSummary,
} from "@types";

export const dataApi = {
  async getUserGrowthData(params: DataReportParams) {
    const response = await api.get<UserGrowthData[]>(`/data/user-growth`, {
      params,
    });
    return response.data;
  },

  async getRetentionCohorts(params: DataReportParams) {
    const queryParams: any = {
      "timeRange[startDate]": params.timeRange.startDate,
      "timeRange[endDate]": params.timeRange.endDate,
      granularity: params.granularity,
      cohortBy: params.cohortBy,
      limit: params.limit,
      offset: params.offset,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await api.get<RetentionCohort[]>(
      `/data/retention-cohorts`,
      {
        params: queryParams,
      }
    );
    return response.data;
  },

  async getAverageTimeToFirstStream(params: DataReportParams) {
    const response = await api.get<{
      averageTimeToFirstStream: number;
      usersWithoutStreams: number;
    }>(`/data/average-time-to-first-stream`, {
      params,
    });
    return response.data;
  },

  async getKpisData(params: DataReportParams) {
    const response = await api.get<KpisData>(`/data/kpis`, {
      params,
    });
    return response.data;
  },

  async getAnomaliesData(params: DataReportParams) {
    const response = await api.get<AnomaliesData>(`/data/anomalies`, {
      params,
    });
    return response.data;
  },

  async getExecutiveSummaryData(params: DataReportParams) {
    const response = await api.get<ExecutiveSummary>(
      `/data/executive-summary`,
      {
        params,
      }
    );
    return response.data;
  },

  async getEngagementMetrics(params: DataReportParams) {
    const response = await api.get<EngagementMetrics>(`/data/engagement`, {
      params,
    });
    return response.data;
  },

  async getModerationMetrics(params: DataReportParams) {
    const response = await api.get<ModerationMetrics>(`/data/moderation`, {
      params,
    });
    return response.data;
  },

  async getContentHealthMetrics(params: DataReportParams) {
    const response = await api.get<ContentHealthMetrics>(
      `/data/content-health`,
      {
        params,
      }
    );
    return response.data;
  },

  async getActivityTimeline(params: DataReportParams) {
    const response = await api.get<ActivityTimelineData[]>(
      `/data/activity-timeline`,
      {
        params,
      }
    );
    return response.data;
  },

  async getArtistPerformance(params: DataReportParams) {
    const response = await api.get<any[]>(`/data/artist-performance`, {
      params,
    });
    return response.data;
  },

  async getChurnMetrics(params: DataReportParams) {
    const response = await api.get<any>(`/data/churn-metrics`, {
      params,
    });
    return response.data;
  },

  async getEngagementTimeSeries(params: DataReportParams) {
    const response = await api.get<any[]>(`/data/engagement-timeseries`, {
      params,
    });
    return response.data;
  },

  async getParetoData(params: DataReportParams) {
    const response = await api.get<any[]>(`/data/pareto`, {
      params,
    });
    return response.data;
  },

  async getDetailedPeriods(params: DataReportParams) {
    const response = await api.get<DetailedPeriodData[]>(
      `/data/detailed-periods`,
      {
        params,
      }
    );
    return response.data;
  },

  async getEnhancedTrackPerformance(params: DataReportParams) {
    console.log("🎵 [API] Calling enhanced-tracks with params:", params);

    // Build query params properly - don't spread the whole params object
    const queryParams: any = {
      "timeRange[startDate]": params.timeRange.startDate,
      "timeRange[endDate]": params.timeRange.endDate,
      limit: params.limit,
      offset: params.offset,
      minStreams: params.minStreams,
      minEngagementRate: params.minEngagementRate,
      minGrowthPercent: params.minGrowthPercent,
      searchTerm: params.searchTerm,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      showOnlyNew: params.showOnlyNew,
      showOnlyTrending: params.showOnlyTrending,
    };

    // Handle array parameters
    if (params.artistIds && params.artistIds.length > 0) {
      queryParams.artistIds = JSON.stringify(params.artistIds);
    }
    if (params.genres && params.genres.length > 0) {
      queryParams.genres = JSON.stringify(params.genres);
    }
    if (params.albumIds && params.albumIds.length > 0) {
      queryParams.albumIds = JSON.stringify(params.albumIds);
    }

    const response = await api.get<any[]>(`/data/enhanced-tracks`, {
      params: queryParams,
    });
    console.log(
      "🎵 [API] Enhanced tracks response:",
      response.data.length,
      "tracks"
    );
    return response.data;
  },

  async getArtistFilterOptions() {
    const response = await api.get<Array<{ id: string; name: string }>>(
      `/data/filter-options/artists`
    );
    return response.data;
  },

  async getGenreFilterOptions() {
    const response = await api.get<string[]>(`/data/filter-options/genres`);
    return response.data;
  },

  async getAlbumFilterOptions() {
    const response = await api.get<
      Array<{ id: string; title: string; artistName: string }>
    >(`/data/filter-options/albums`);
    return response.data;
  },

  async getGenreBreakdown(params: DataReportParams) {
    const response = await api.get<any[]>(`/data/genre-breakdown`, {
      params: {
        "timeRange[startDate]": params.timeRange.startDate,
        "timeRange[endDate]": params.timeRange.endDate,
      },
    });
    return response.data;
  },

  async getUserAnalytics(params: DataReportParams) {
    const queryParams: any = {
      "timeRange[startDate]": params.timeRange.startDate,
      "timeRange[endDate]": params.timeRange.endDate,
      limit: params.limit,
      offset: params.offset,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      searchTerm: params.searchTerm,
      minStreams: params.minStreams,
    };

    const response = await api.get<any[]>(`/data/user-analytics`, {
      params: queryParams,
    });
    return response.data;
  },
  async getPeakActivityHour(params: DataReportParams) {
    const response = await api.get<{ hour: number; totalActivity: number }>(
      `/data/peak-hour`,
      {
        params,
      }
    );
    return response.data;
  },
};
