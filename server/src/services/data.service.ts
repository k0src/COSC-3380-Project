import type {
  DataReportParams,
  ExecutiveOverviewData,
  ExecutiveSummary,
  KPIMetric,
  Anomaly,
  UserGrowthMetrics,
  UserGrowthData,
  RetentionCohort,
  EngagementMetrics,
  TopTrack,
  ModerationMetrics,
  RepeatOffender,
  ContentHealthMetrics,
  PlaylistHealthMetrics,
  ArtistPerformance,
  ActivityTimelineData,
  AnomaliesData,
  ExecutiveSummaryData,
  KpisData,
  DetailedPeriodData,
} from "@types";
import { query } from "@config/database.js";
import { number } from "zod";

export default class DataService {
  /**
   * Get KPIs Data - High-level KPIs with trends and comparisons
   */
  static async getKpisData(params: DataReportParams): Promise<KpisData> {
    console.log(
      "📊 [DATA SERVICE] getKpisData called with params:",
      JSON.stringify(params, null, 2)
    );

    const {
      timeRange,
      compareTo = "previous_period",
      granularity = "day",
    } = params;

    // Calculate comparison period
    const currentStart = new Date(timeRange.startDate);
    const currentEnd = new Date(timeRange.endDate);
    const daysDiff =
      (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24);

    let prevStart: Date;
    let prevEnd: Date;

    if (compareTo === "previous_period") {
      prevEnd = new Date(currentStart);
      prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
      prevStart = new Date(prevEnd.getTime() - daysDiff * 24 * 60 * 60 * 1000);
    } else if (compareTo === "year_ago") {
      prevStart = new Date(currentStart);
      prevStart.setFullYear(prevStart.getFullYear() - 1);
      prevEnd = new Date(currentEnd);
      prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    } else {
      prevStart = currentStart;
      prevEnd = currentEnd;
    }

    // Get Active Users KPI
    const activeUsersData = await query(
      `
      WITH current_period AS (
        SELECT COUNT(DISTINCT user_id) as value
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
      ),
      previous_period AS (
        SELECT COUNT(DISTINCT user_id) as value
        FROM song_history
        WHERE played_at BETWEEN $3 AND $4
      ),
      trend_data AS (
        SELECT
          date_trunc($5, played_at) as period,
          COUNT(DISTINCT user_id) as value
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY period
        ORDER BY period ASC
      )
      SELECT
        (SELECT value FROM current_period) as current_value,
        (SELECT value FROM previous_period) as previous_value,
        array_agg(td.value ORDER BY td.period) as trend
      FROM trend_data td
      `,
      [
        timeRange.startDate,
        timeRange.endDate,
        prevStart.toISOString(),
        prevEnd.toISOString(),
        granularity,
      ]
    );

    // Get Total Streams KPI
    const totalStreamsData = await query(
      `
      WITH current_period AS (
        SELECT COUNT(*) as value
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
      ),
      previous_period AS (
        SELECT COUNT(*) as value
        FROM song_history
        WHERE played_at BETWEEN $3 AND $4
      ),
      trend_data AS (
        SELECT
          date_trunc($5, played_at) as period,
          COUNT(*) as value
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY period
        ORDER BY period ASC
      )
      SELECT
        (SELECT value FROM current_period) as current_value,
        (SELECT value FROM previous_period) as previous_value,
        array_agg(td.value ORDER BY td.period) as trend
      FROM trend_data td
      `,
      [
        timeRange.startDate,
        timeRange.endDate,
        prevStart.toISOString(),
        prevEnd.toISOString(),
        granularity,
      ]
    );

    // Get Unique Songs KPI
    const uniqueSongsData = await query(
      `
      WITH current_period AS (
        SELECT COUNT(DISTINCT song_id) as value
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
      ),
      previous_period AS (
        SELECT COUNT(DISTINCT song_id) as value
        FROM song_history
        WHERE played_at BETWEEN $3 AND $4
      ),
      trend_data AS (
        SELECT
          date_trunc($5, played_at) as period,
          COUNT(DISTINCT song_id) as value
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY period
        ORDER BY period ASC
      )
      SELECT
        (SELECT value FROM current_period) as current_value,
        (SELECT value FROM previous_period) as previous_value,
        array_agg(td.value ORDER BY td.period) as trend
      FROM trend_data td
      `,
      [
        timeRange.startDate,
        timeRange.endDate,
        prevStart.toISOString(),
        prevEnd.toISOString(),
        granularity,
      ]
    );

    // Get Avg Streams per User KPI
    const avgStreamsData = await query(
      `
      WITH current_period AS (
        SELECT
          COUNT(*)::numeric / NULLIF(COUNT(DISTINCT user_id), 0) as value
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
      ),
      previous_period AS (
        SELECT
          COUNT(*)::numeric / NULLIF(COUNT(DISTINCT user_id), 0) as value
        FROM song_history
        WHERE played_at BETWEEN $3 AND $4
      ),
      trend_data AS (
        SELECT
          date_trunc($5, played_at) as period,
          COUNT(*)::numeric / NULLIF(COUNT(DISTINCT user_id), 0) as value
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY period
        ORDER BY period ASC
      )
      SELECT
        (SELECT value FROM current_period) as current_value,
        (SELECT value FROM previous_period) as previous_value,
        array_agg(COALESCE(td.value, 0) ORDER BY td.period) as trend
      FROM trend_data td
      `,
      [
        timeRange.startDate,
        timeRange.endDate,
        prevStart.toISOString(),
        prevEnd.toISOString(),
        granularity,
      ]
    );

    // Get Engagement Rate KPI
    const engagementData = await query(
      `
      WITH current_period AS (
        SELECT
          ((SELECT COUNT(*) FROM song_likes WHERE liked_at BETWEEN $1 AND $2) +
           (SELECT COUNT(*) FROM comments WHERE commented_at BETWEEN $1 AND $2))::numeric /
          NULLIF((SELECT COUNT(*) FROM song_history WHERE played_at BETWEEN $1 AND $2), 0) * 100 as value
      ),
      previous_period AS (
        SELECT
          ((SELECT COUNT(*) FROM song_likes WHERE liked_at BETWEEN $3 AND $4) +
           (SELECT COUNT(*) FROM comments WHERE commented_at BETWEEN $3 AND $4))::numeric /
          NULLIF((SELECT COUNT(*) FROM song_history WHERE played_at BETWEEN $3 AND $4), 0) * 100 as value
      ),
      trend_data AS (
        SELECT
          sh.period,
          (COALESCE(sl.likes, 0) + COALESCE(c.comments, 0))::numeric / NULLIF(sh.streams, 0) * 100 as value
        FROM (
          SELECT
            date_trunc($5, played_at) as period,
            COUNT(*) as streams
          FROM song_history
          WHERE played_at BETWEEN $1 AND $2
          GROUP BY date_trunc($5, played_at)
        ) sh
        LEFT JOIN (
          SELECT
            date_trunc($5, liked_at) as period,
            COUNT(*) as likes
          FROM song_likes
          WHERE liked_at BETWEEN $1 AND $2
          GROUP BY date_trunc($5, liked_at)
        ) sl ON sh.period = sl.period
        LEFT JOIN (
          SELECT
            date_trunc($5, commented_at) as period,
            COUNT(*) as comments
          FROM comments
          WHERE commented_at BETWEEN $1 AND $2
          GROUP BY date_trunc($5, commented_at)
        ) c ON sh.period = c.period
        ORDER BY sh.period ASC
      )
      SELECT
        (SELECT value FROM current_period) as current_value,
        (SELECT value FROM previous_period) as previous_value,
        array_agg(COALESCE(td.value, 0) ORDER BY td.period) as trend
      FROM trend_data td
      `,
      [
        timeRange.startDate,
        timeRange.endDate,
        prevStart.toISOString(),
        prevEnd.toISOString(),
        granularity,
      ]
    );

    // Helper function to create KPI metric
    const createKPIMetric = (label: string, data: any): KPIMetric => {
      const currentValue = parseFloat(data.current_value) || 0;
      const previousValue = parseFloat(data.previous_value) || 0;
      const delta = currentValue - previousValue;

      let deltaPercent = 0;
      if (previousValue > 0) {
        deltaPercent = (delta / previousValue) * 100;
      } else if (previousValue === 0 && currentValue > 0) {
        deltaPercent = 100;
      }

      const trend = data.trend || [];
      const isSignificant = Math.abs(deltaPercent) > 5;

      return {
        label,
        currentValue,
        previousValue,
        delta,
        deltaPercent,
        trend,
        isSignificant,
      };
    };

    const kpis = {
      activeUsers: createKPIMetric("Active Users", activeUsersData[0] || {}),
      totalStreams: createKPIMetric("Total Streams", totalStreamsData[0] || {}),
      uniqueSongs: createKPIMetric("Unique Songs", uniqueSongsData[0] || {}),
      avgStreamsPerUser: createKPIMetric(
        "Avg Streams/User",
        avgStreamsData[0] || {}
      ),
      engagementRate: createKPIMetric(
        "Engagement Rate",
        engagementData[0] || {}
      ),
    };

    console.log("✅ [DATA SERVICE] getKpisData completed");
    return { timeRange, kpis };
  }

  /**
   * Get Anomalies Data - Detect anomalies in metrics
   */
  static async getAnomaliesData(
    params: DataReportParams
  ): Promise<AnomaliesData> {
    console.log(
      "🚨 [DATA SERVICE] getAnomaliesData called with params:",
      JSON.stringify(params, null, 2)
    );

    const { timeRange, granularity = "day" } = params;
    const anomalies = await this.detectAnomalies(timeRange, granularity);

    console.log("✅ [DATA SERVICE] getAnomaliesData completed");
    return { timeRange, anomalies };
  }

  /**
   * Get Executive Summary Data - Generate executive summary
   */
  static async getExecutiveSummaryData(
    params: DataReportParams
  ): Promise<ExecutiveSummaryData> {
    console.log(
      "📋 [DATA SERVICE] getExecutiveSummaryData called with params:",
      JSON.stringify(params, null, 2)
    );

    const { timeRange } = params;

    const kpisData = await this.getKpisData(params);
    const anomaliesData = await this.getAnomaliesData(params);

    const summary = this.generateExecutiveSummary(
      kpisData.kpis,
      timeRange,
      anomaliesData.anomalies
    );

    console.log("✅ [DATA SERVICE] getExecutiveSummaryData completed");
    return { timeRange, summary };
  }

  // /**
  //  * Executive Overview - High-level KPIs with trends and comparisons
  //  */
  // static async getExecutiveOverview(
  //   params: DataReportParams
  // ): Promise<ExecutiveOverviewData> {
  //   console.log(
  //     "📊 [DATA SERVICE] getExecutiveOverview called with params:",
  //     JSON.stringify(params, null, 2)
  //   );

  //   // Use the split functions to get data
  //   const [kpisData, summaryData, anomaliesData] = await Promise.all([
  //     this.getKpisData(params),
  //     this.getExecutiveSummaryData(params),
  //     this.getAnomaliesData(params),
  //   ]);

  //   const result = {
  //     timeRange: params.timeRange,
  //     kpis: kpisData.kpis,
  //     summary: summaryData.summary,
  //     anomalies: anomaliesData.anomalies,
  //   };

  //   console.log("✅ [DATA SERVICE] Returning executive overview with KPIs:", {
  //     activeUsers: kpisData.kpis.activeUsers.currentValue,
  //     totalStreams: kpisData.kpis.totalStreams.currentValue,
  //     engagementRate:
  //       kpisData.kpis.engagementRate.currentValue.toFixed(2) + "%",
  //   });

  //   return result;
  // }
  /**
   * Detect anomalies in metrics using z-score
   */
  private static async detectAnomalies(
    timeRange: { startDate: string; endDate: string },
    granularity: string
  ): Promise<Anomaly[]> {
    const anomaliesData = await query(
      `
      WITH daily_stats AS (
        SELECT
          date_trunc($3, played_at) as period,
          COUNT(*) as stream_count,
          COUNT(DISTINCT user_id) as user_count
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY period
      ),
      stats_with_avg AS (
        SELECT
          period,
          stream_count,
          user_count,
          AVG(stream_count) OVER () as avg_streams,
          STDDEV(stream_count) OVER () as stddev_streams
        FROM daily_stats
      )
      SELECT
        period,
        stream_count,
        (stream_count - avg_streams) / NULLIF(stddev_streams, 0) as z_score
      FROM stats_with_avg
      WHERE ABS((stream_count - avg_streams) / NULLIF(stddev_streams, 0)) > 2
      ORDER BY ABS((stream_count - avg_streams) / NULLIF(stddev_streams, 0)) DESC
      LIMIT 5
      `,
      [timeRange.startDate, timeRange.endDate, granularity]
    );

    return anomaliesData.map((row) => ({
      date: row.period,
      metric: "streams",
      value: parseInt(row.stream_count),
      zScore: parseFloat(row.z_score),
      description: `Unusual activity: ${parseInt(
        row.stream_count
      )} streams (z-score: ${parseFloat(row.z_score).toFixed(2)})`,
    }));
  }

  /**
   * Generate executive summary - Returns structured data, NOT markup
   */
  private static generateExecutiveSummary(
    kpis: ExecutiveOverviewData["kpis"],
    timeRange: { startDate: string; endDate: string },
    anomalies: Anomaly[]
  ): ExecutiveSummary {
    return {
      timeRange,
      totalStreams: kpis.totalStreams.currentValue,
      activeUsers: kpis.activeUsers.currentValue,
      uniqueSongs: kpis.uniqueSongs.currentValue,
      avgStreamsPerUser: kpis.avgStreamsPerUser.currentValue,
      engagementRate: kpis.engagementRate.currentValue,
      userTrend: {
        direction: kpis.activeUsers.deltaPercent > 0 ? "growth" : "decline",
        percent: Math.abs(kpis.activeUsers.deltaPercent),
        delta: kpis.activeUsers.delta,
        isSignificant: kpis.activeUsers.isSignificant,
      },
      streamTrend: {
        direction: kpis.totalStreams.deltaPercent > 0 ? "growth" : "decline",
        percent: Math.abs(kpis.totalStreams.deltaPercent),
      },
      songChange: {
        delta: kpis.uniqueSongs.delta,
        percent: kpis.uniqueSongs.deltaPercent,
      },
      engagementChange: {
        percent: kpis.engagementRate.deltaPercent,
        isLarge: Math.abs(kpis.engagementRate.deltaPercent) >= 5,
      },
      topAnomalies: anomalies.slice(0, 3).map((anomaly) => ({
        date: anomaly.date,
        metric: anomaly.metric,
        value: anomaly.value,
        zScore: anomaly.zScore,
        severity: Math.abs(anomaly.zScore) > 3 ? "high" : "moderate",
      })),
    };
  }

  /**
   * User Growth & Retention Analytics
   */
  static async getUserGrowthData(
    params: DataReportParams
  ): Promise<UserGrowthData[]> {
    const { timeRange, granularity = "week" } = params;

    const growthData = await query<UserGrowthData>(
      `
      WITH period_data AS (
        SELECT
          date_trunc($3, created_at) as period,
          COUNT(*) as new_users
        FROM users
        WHERE created_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_users du WHERE du.user_id = users.id)
        GROUP BY period
        ORDER BY period ASC
      ),
      cumulative AS (
        SELECT
          period,
          new_users,
          SUM(new_users) OVER (ORDER BY period) as total_users
        FROM period_data
      )
      SELECT
        period::text,
        new_users::integer as "newUsers",
        total_users::integer as "totalUsers",
        CASE
          WHEN LAG(new_users) OVER (ORDER BY period) > 0
          THEN ((new_users::numeric - LAG(new_users) OVER (ORDER BY period)) /
                LAG(new_users) OVER (ORDER BY period) * 100)
          ELSE 0
        END as "growthRate"
      FROM cumulative
      ORDER BY period ASC
      `,
      [timeRange.startDate, timeRange.endDate, granularity]
    );

    return growthData;
  }

  static async getRetentionCohorts(
    params: DataReportParams
  ): Promise<RetentionCohort[]> {
    const {
      timeRange,
      cohortBy = "signup_week",
      limit = 10,
      offset = 0,
      sortBy = "cohortWeek",
      sortDirection = "DESC",
    } = params;

    const cohortTrunc = cohortBy === "signup_month" ? "month" : "week";

    // Build ORDER BY clause
    const orderByColumn =
      sortBy === "cohortWeek"
        ? "cs.cohort_week"
        : sortBy === "cohortSize"
        ? "cs.cohort_size"
        : sortBy === "day1"
        ? "rd.day1"
        : sortBy === "day7"
        ? "rd.day7"
        : sortBy === "day14"
        ? "rd.day14"
        : sortBy === "day28"
        ? "rd.day28"
        : sortBy === "day90"
        ? "rd.day90"
        : "cs.cohort_week";

    const orderDirection = sortDirection === "ASC" ? "ASC" : "DESC";

    const retentionCohorts = await query<RetentionCohort>(
      `
      WITH cohorts AS (
        SELECT
          date_trunc($3, created_at) as cohort_week,
          id as user_id
        FROM users
        WHERE created_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_users du WHERE du.user_id = users.id)
      ),
      cohort_sizes AS (
        SELECT cohort_week, COUNT(*) as cohort_size
        FROM cohorts
        GROUP BY cohort_week
      ),
      retention_data AS (
        SELECT
          c.cohort_week,
          COUNT(DISTINCT CASE
            WHEN sh.played_at BETWEEN c.cohort_week AND c.cohort_week + interval '1 day'
            THEN sh.user_id
          END) as day1,
          COUNT(DISTINCT CASE
            WHEN sh.played_at BETWEEN c.cohort_week AND c.cohort_week + interval '7 days'
            THEN sh.user_id
          END) as day7,
          COUNT(DISTINCT CASE
            WHEN sh.played_at BETWEEN c.cohort_week AND c.cohort_week + interval '14 days'
            THEN sh.user_id
          END) as day14,
          COUNT(DISTINCT CASE
            WHEN sh.played_at BETWEEN c.cohort_week AND c.cohort_week + interval '28 days'
            THEN sh.user_id
          END) as day28,
          COUNT(DISTINCT CASE
            WHEN sh.played_at BETWEEN c.cohort_week AND c.cohort_week + interval '90 days'
            THEN sh.user_id
          END) as day90
        FROM cohorts c
        LEFT JOIN song_history sh ON sh.user_id = c.user_id
        GROUP BY c.cohort_week
      )
      SELECT
        cs.cohort_week::text as "cohortWeek",
        cs.cohort_size::integer as "cohortSize",
        rd.day1::integer,
        rd.day7::integer,
        rd.day14::integer,
        rd.day28::integer,
        rd.day90::integer
      FROM cohort_sizes cs
      LEFT JOIN retention_data rd ON rd.cohort_week = cs.cohort_week
      ORDER BY cs.cohort_week DESC
      LIMIT $3
      OFFSET $4
      `,
      [timeRange.startDate, timeRange.endDate, limit, offset]
    );

    return retentionCohorts;
  }

  static async getAverageTimeToFirstStream(
    params: DataReportParams
  ): Promise<{
    averageTimeToFirstStream: number;
    usersWithoutStreams: number;
  }> {
    const { timeRange } = params;

    const avgTimeData = await query<{
      avg_hours: string;
      users_with_streams: string;
      users_without_streams: string;
    }>(
      `
      WITH first_streams AS (
        SELECT
          u.id as user_id,
          u.created_at,
          MIN(sh.played_at) as first_stream
        FROM users u
        LEFT JOIN song_history sh ON sh.user_id = u.id
        WHERE u.created_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_users du WHERE du.user_id = u.id)
        GROUP BY u.id, u.created_at
      )
      SELECT
        AVG(EXTRACT(EPOCH FROM (first_stream - created_at)) / 3600) as avg_hours,
        COUNT(*) FILTER (WHERE first_stream IS NOT NULL) as users_with_streams,
        COUNT(*) FILTER (WHERE first_stream IS NULL) as users_without_streams
      FROM first_streams
      `,
      [timeRange.startDate, timeRange.endDate]
    );

    const averageTimeToFirstStream = parseFloat(
      avgTimeData[0]?.avg_hours || "0"
    );
    const usersWithoutStreams = parseInt(
      avgTimeData[0]?.users_without_streams || "0"
    );

    return {
      averageTimeToFirstStream,
      usersWithoutStreams,
    };
  }

  // const story = this.generateUserGrowthStory(
  //   growthData,
  //   retentionCohorts,
  //   averageTimeToFirstStream,
  //   usersWithoutStreams
  // );

  /**
   * Generate user growth story
   */
  // private static generateUserGrowthStory(
  //   growthData: UserGrowthData[],
  //   cohorts: RetentionCohort[],
  //   avgTime: number,
  //   usersWithoutStreams: number = 0
  // ): string {
  //   if (growthData.length === 0) {
  //     return "No user growth data available for the selected period.";
  //   }

  //   const latestPeriod = growthData[growthData.length - 1];
  //   const totalNew = growthData.reduce((sum, d) => sum + d.newUsers, 0);

  //   let story = `During this period, CoogMusic gained ${totalNew.toLocaleString()} new users. `;

  //   if (latestPeriod && latestPeriod.growthRate !== 0) {
  //     story += `The most recent period showed a ${
  //       latestPeriod.growthRate > 0 ? "growth" : "decline"
  //     } of ${Math.abs(latestPeriod.growthRate).toFixed(1)}%. `;
  //   }

  //   if (cohorts.length > 0 && cohorts[0] && cohorts[0].cohortSize > 0) {
  //     const latestCohort = cohorts[0];
  //     const day28Retention =
  //       (latestCohort.day28 / latestCohort.cohortSize) * 100;
  //     story += `The most recent cohort (${
  //       latestCohort.cohortSize
  //     } users) has a 28-day retention rate of ${day28Retention.toFixed(1)}%. `;
  //   }

  //   story += `On average, new users take ${avgTime.toFixed(
  //     1
  //   )} hours to play their first song.`;

  //   if (usersWithoutStreams > 0) {
  //     story += ` Note: ${usersWithoutStreams} users have not streamed any songs yet.`;
  //   }

  //   return story;
  // }

  /**
   * Listening & Engagement Deep Dive
   */
  static async getEngagementMetrics(
    params: DataReportParams
  ): Promise<EngagementMetrics> {
    console.log(
      "🎵 [DATA SERVICE] getEngagementMetrics called with params:",
      JSON.stringify(params, null, 2)
    );

    const { timeRange, limit = 50, minStreams = 10 } = params;

    // Get top tracks
    const topTracksData = await query(
      `
      WITH current_streams AS (
        SELECT
          sh.song_id,
          s.title,
          STRING_AGG(DISTINCT a.display_name, ', ') as artist_name,
          COUNT(*) as streams,
          COUNT(DISTINCT sh.user_id) as unique_listeners
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        LEFT JOIN song_artists sa ON sa.song_id = s.id
        LEFT JOIN artists a ON a.id = sa.artist_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
        GROUP BY sh.song_id, s.title
        HAVING COUNT(*) >= $3
      ),
      previous_streams AS (
        SELECT
          song_id,
          COUNT(*) as prev_streams
        FROM song_history
        WHERE played_at < $1
          AND played_at >= $1::timestamp - ($2::timestamp - $1::timestamp)
        GROUP BY song_id
      ),
      trend_data AS (
        SELECT
          song_id,
          date_trunc('day', played_at) as period,
          COUNT(*) as daily_streams
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY song_id, period
      ),
      song_trends AS (
        SELECT
          song_id,
          array_agg(daily_streams ORDER BY period) as trend
        FROM trend_data
        GROUP BY song_id
      )
      SELECT
        cs.song_id as "songId",
        cs.title,
        cs.artist_name as "artistName",
        cs.streams::integer,
        cs.unique_listeners::integer as "uniqueListeners",
        CASE
          WHEN COALESCE(ps.prev_streams, 0) > 0
          THEN ((cs.streams::numeric - COALESCE(ps.prev_streams, 0)) / ps.prev_streams * 100)
          WHEN COALESCE(ps.prev_streams, 0) = 0 AND cs.streams > 0
          THEN 100.0
          ELSE 0
        END as "growthPercent",
        COALESCE(st.trend, ARRAY[]::integer[]) as trend
      FROM current_streams cs
      LEFT JOIN previous_streams ps ON ps.song_id = cs.song_id
      LEFT JOIN song_trends st ON st.song_id = cs.song_id
      ORDER BY cs.streams DESC
      LIMIT $4
      `,
      [timeRange.startDate, timeRange.endDate, minStreams, limit]
    );

    console.log("🎵 Top tracks data (first 3):", topTracksData.slice(0, 3));

    // Calculate concentration (Pareto analysis)
    console.log("📊 [DATA SERVICE] Calculating Pareto concentration...");
    const concentrationData = await query(
      `
      WITH song_streams AS (
        SELECT
          song_id,
          COUNT(*) as streams
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY song_id
      ),
      ranked_songs AS (
        SELECT
          streams,
          SUM(streams) OVER () as total_streams,
          ROW_NUMBER() OVER (ORDER BY streams DESC) as rank,
          COUNT(*) OVER () as total_songs
        FROM song_streams
      ),
      cumulative AS (
        SELECT
          rank,
          streams,
          total_streams,
          total_songs,
          SUM(streams) OVER (ORDER BY rank) as cumulative_streams
        FROM ranked_songs
      )
      SELECT
        MAX(CASE WHEN rank <= GREATEST(1, CEIL(total_songs * 0.01)) THEN cumulative_streams ELSE 0 END)::numeric /
          NULLIF(MAX(total_streams), 0) * 100 as top_1_percent,
        MAX(CASE WHEN rank <= GREATEST(1, CEIL(total_songs * 0.10)) THEN cumulative_streams ELSE 0 END)::numeric /
          NULLIF(MAX(total_streams), 0) * 100 as top_10_percent,
        MAX(CASE WHEN rank <= GREATEST(1, CEIL(total_songs * 0.50)) THEN cumulative_streams ELSE 0 END)::numeric /
          NULLIF(MAX(total_streams), 0) * 100 as top_50_percent,
        MAX(total_songs)::integer as total_songs_count
      FROM cumulative
      `,
      [timeRange.startDate, timeRange.endDate]
    );

    console.log("📊 Concentration data:", concentrationData[0]);
    console.log(
      "📊 Total songs in dataset:",
      concentrationData[0]?.total_songs_count
    );

    const concentration = {
      top1Percent: parseFloat(concentrationData[0]?.top_1_percent) || 0,
      top10Percent: parseFloat(concentrationData[0]?.top_10_percent) || 0,
      top50Percent: parseFloat(concentrationData[0]?.top_50_percent) || 0,
    };

    console.log("📊 Parsed concentration:", concentration);

    // Calculate average session length (time between first and last play in a day)
    const sessionData = await query(
      `
      WITH daily_sessions AS (
        SELECT
          user_id,
          DATE(played_at) as session_date,
          MAX(played_at) - MIN(played_at) as session_length
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY user_id, DATE(played_at)
        HAVING COUNT(*) > 1
      )
      SELECT AVG(EXTRACT(EPOCH FROM session_length) / 60) as avg_minutes
      FROM daily_sessions
      `,
      [timeRange.startDate, timeRange.endDate]
    );

    const averageSessionLength = parseFloat(sessionData[0]?.avg_minutes) || 0;

    const topTracks = topTracksData.map((track) => ({
      songId: track.songId,
      title: track.title,
      artistName: track.artistName || "Unknown Artist",
      streams: track.streams,
      uniqueListeners: track.uniqueListeners,
      growthPercent: parseFloat(track.growthPercent) || 0,
      trend: track.trend || [],
    }));

    // Generate story
    const story = this.generateEngagementStory(
      topTracks,
      concentration,
      averageSessionLength
    );

    return {
      timeRange,
      topTracks,
      concentration,
      averageSessionLength,
      story,
    };
  }

  /**
   * Generate engagement story
   */
  private static generateEngagementStory(
    topTracks: TopTrack[],
    concentration: EngagementMetrics["concentration"],
    avgSession: number
  ): string {
    if (topTracks.length === 0) {
      return "No engagement data available for the selected period.";
    }

    const topTrack = topTracks[0];
    const totalStreams = topTracks.reduce((sum, t) => sum + t.streams, 0);

    let story = `The top ${
      topTracks.length
    } tracks accumulated ${totalStreams.toLocaleString()} streams. `;

    if (topTrack) {
      story += `The most popular track, "${topTrack.title}" by ${
        topTrack.artistName
      }, had ${topTrack.streams.toLocaleString()} streams from ${topTrack.uniqueListeners.toLocaleString()} unique listeners. `;
    }

    story += `The top 1% of songs account for ${concentration.top1Percent.toFixed(
      1
    )}% of all streams, showing ${
      concentration.top1Percent > 50 ? "high" : "moderate"
    } concentration. `;

    story += `Average listening session length is ${avgSession.toFixed(
      1
    )} minutes.`;

    return story;
  }

  /**
   * Moderation Analytics
   */
  static async getModerationMetrics(
    params: DataReportParams
  ): Promise<ModerationMetrics> {
    const { timeRange } = params;

    // Get report statistics
    const reportStats = await query(
      `
      WITH all_reports AS (
        SELECT report_id, report_status, reported_at, report_type, reviewer_id
        FROM song_reports
        WHERE reported_at BETWEEN $1 AND $2
        UNION ALL
        SELECT id as report_id, report_status, reported_at, report_type, reviewer_id
        FROM album_reports
        WHERE reported_at BETWEEN $1 AND $2
        UNION ALL
        SELECT id as report_id, report_status, reported_at, report_type, reviewer_id
        FROM playlist_reports
        WHERE reported_at BETWEEN $1 AND $2
        UNION ALL
        SELECT id as report_id, report_status, reported_at, report_type, reviewer_id
        FROM user_reports
        WHERE reported_at BETWEEN $1 AND $2
      )
      SELECT
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE report_status = 'RESOLVED') as resolved_reports,
        COUNT(*) FILTER (WHERE report_status = 'DISMISSED') as dismissed_reports,
        COUNT(*) FILTER (WHERE report_status = 'PENDING') as pending_reports,
        COUNT(*) FILTER (WHERE report_status != 'PENDING')::numeric /
          NULLIF(COUNT(*), 0) * 100 as action_rate
      FROM all_reports
      `,
      [timeRange.startDate, timeRange.endDate]
    );

    // Get average resolution time (placeholder - would need resolved_at column)
    const avgResolutionTime = 0; // Hours

    // Get reports by type
    const reportsByTypeData = await query(
      `
      WITH all_reports AS (
        SELECT report_type FROM song_reports WHERE reported_at BETWEEN $1 AND $2
        UNION ALL
        SELECT report_type FROM album_reports WHERE reported_at BETWEEN $1 AND $2
        UNION ALL
        SELECT report_type FROM playlist_reports WHERE reported_at BETWEEN $1 AND $2
        UNION ALL
        SELECT report_type FROM user_reports WHERE reported_at BETWEEN $1 AND $2
      )
      SELECT
        report_type as type,
        COUNT(*)::integer as count
      FROM all_reports
      GROUP BY report_type
      ORDER BY count DESC
      `,
      [timeRange.startDate, timeRange.endDate]
    );

    const stats = reportStats[0] || {};
    const totalReports = parseInt(stats.total_reports) || 0;
    const resolvedReports = parseInt(stats.resolved_reports) || 0;
    const dismissedReports = parseInt(stats.dismissed_reports) || 0;
    const pendingReports = parseInt(stats.pending_reports) || 0;
    const actionRate = parseFloat(stats.action_rate) || 0;

    const reportsByType = reportsByTypeData.map((row) => ({
      type: row.type,
      count: row.count,
    }));

    // Generate story
    const story = this.generateModerationStory(
      totalReports,
      resolvedReports,
      dismissedReports,
      actionRate
    );

    return {
      timeRange,
      totalReports,
      resolvedReports,
      dismissedReports,
      pendingReports,
      avgResolutionTime,
      actionRate,
      reportsByType,
      story,
    };
  }

  /**
   * Generate moderation story
   */
  private static generateModerationStory(
    total: number,
    resolved: number,
    dismissed: number,
    actionRate: number
  ): string {
    if (total === 0) {
      return "No moderation reports during this period.";
    }

    let story = `The moderation team received ${total.toLocaleString()} reports during this period. `;

    story += `${resolved.toLocaleString()} reports were resolved (content actioned) and ${dismissed.toLocaleString()} were dismissed. `;

    story += `The overall action rate is ${actionRate.toFixed(
      1
    )}%, indicating that ${
      actionRate > 50 ? "most" : "many"
    } reports result in moderation action.`;

    return story;
  }

  /**
   * Get Content Health Metrics
   */
  static async getContentHealthMetrics(
    params: DataReportParams
  ): Promise<ContentHealthMetrics> {
    const { timeRange } = params;

    const healthData = await query(
      `
      SELECT
        COUNT(*) as total_songs,
        COUNT(*) FILTER (WHERE title IS NOT NULL AND genre IS NOT NULL) as songs_with_metadata,
        COUNT(*) FILTER (WHERE image_url IS NOT NULL) as songs_with_cover
      FROM songs
      WHERE created_at BETWEEN $1 AND $2
        AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = songs.id)
      `,
      [timeRange.startDate, timeRange.endDate]
    );

    const data = healthData[0] || {};
    const totalSongs = parseInt(data.total_songs) || 0;
    const songsWithMetadata = parseInt(data.songs_with_metadata) || 0;
    const songsWithCover = parseInt(data.songs_with_cover) || 0;

    const metadataCompletenessScore =
      totalSongs > 0 ? (songsWithMetadata / totalSongs) * 100 : 0;

    const story = `Out of ${totalSongs.toLocaleString()} songs created during this period, ${songsWithMetadata.toLocaleString()} (${metadataCompletenessScore.toFixed(
      1
    )}%) have complete metadata. ${songsWithCover.toLocaleString()} songs have cover art.`;

    return {
      timeRange,
      totalSongs,
      songsWithMetadata,
      songsWithCover,
      metadataCompletenessScore,
      story,
    };
  }

  /**
   * Get Activity Timeline Data
   */
  static async getActivityTimeline(
    params: DataReportParams
  ): Promise<ActivityTimelineData[]> {
    const { timeRange, granularity = "day" } = params;

    console.log("📊 [DATA SERVICE] getActivityTimeline called with params:", {
      timeRange,
      granularity,
    });

    const timelineData = await query<ActivityTimelineData>(
      `
      WITH periods AS (
        SELECT date_trunc($3, generate_series(
          $1::timestamp,
          $2::timestamp,
          ('1 ' || $3)::interval
        )) as period
      ),
      stream_data AS (
        SELECT
          date_trunc($3, played_at) as period,
          COUNT(*) as streams
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY date_trunc($3, played_at)
      ),
      like_data AS (
        SELECT
          date_trunc($3, liked_at) as period,
          COUNT(*) as likes
        FROM song_likes
        WHERE liked_at BETWEEN $1 AND $2
        GROUP BY date_trunc($3, liked_at)
      ),
      comment_data AS (
        SELECT
          date_trunc($3, commented_at) as period,
          COUNT(*) as comments
        FROM comments
        WHERE commented_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_comments dc WHERE dc.comment_id = comments.id)
        GROUP BY date_trunc($3, commented_at)
      ),
      follower_data AS (
        SELECT
          date_trunc($3, followed_at) as period,
          COUNT(*) as followers
        FROM user_followers
        WHERE followed_at BETWEEN $1 AND $2
        GROUP BY date_trunc($3, followed_at)
      )
      SELECT
        p.period::text,
        COALESCE(sd.streams, 0)::integer as streams,
        COALESCE(ld.likes, 0)::integer as likes,
        COALESCE(cd.comments, 0)::integer as comments,
        COALESCE(fd.followers, 0)::integer as followers
      FROM periods p
      LEFT JOIN stream_data sd ON sd.period = p.period
      LEFT JOIN like_data ld ON ld.period = p.period
      LEFT JOIN comment_data cd ON cd.period = p.period
      LEFT JOIN follower_data fd ON fd.period = p.period
      ORDER BY p.period ASC
      `,
      [timeRange.startDate, timeRange.endDate, granularity]
    );

    console.log(
      "📈 [DATA SERVICE] getActivityTimeline returned",
      timelineData.length,
      "rows"
    );
    if (timelineData.length > 0) {
      console.log("📊 Sample row:", timelineData[0]);
    }

    return timelineData;
  }

  /**
   * Get Artist Performance Metrics
   */
  static async getArtistPerformanceMetrics(
    params: DataReportParams
  ): Promise<ArtistPerformance[]> {
    const { timeRange, limit = 20, minStreams = 10 } = params;

    console.log(
      "🎤 [DATA SERVICE] getArtistPerformanceMetrics called with params:",
      {
        timeRange,
        limit,
        minStreams,
      }
    );

    // Calculate comparison period for growth
    const currentStart = new Date(timeRange.startDate);
    const currentEnd = new Date(timeRange.endDate);
    const daysDiff =
      (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24);

    const prevEnd = new Date(currentStart);
    prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    const prevStart = new Date(
      prevEnd.getTime() - daysDiff * 24 * 60 * 60 * 1000
    );

    console.log("📅 Previous period for artist growth:", {
      prevStart: prevStart.toISOString(),
      prevEnd: prevEnd.toISOString(),
      daysDiff,
    });

    const artistsData = await query<ArtistPerformance>(
      `
      WITH current_artist_streams AS (
        SELECT
          a.id as artist_id,
          a.display_name,
          COUNT(*) as total_streams,
          COUNT(DISTINCT sh.user_id) as unique_listeners,
          COUNT(*)::numeric / NULLIF(COUNT(DISTINCT sh.user_id), 0) as avg_streams_per_listener
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN song_artists sa ON sa.song_id = s.id
        JOIN artists a ON a.id = sa.artist_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
          AND NOT EXISTS (SELECT 1 FROM deleted_artists da WHERE da.artist_id = a.id)
        GROUP BY a.id, a.display_name
        HAVING COUNT(*) >= $3
      ),
      previous_artist_streams AS (
        SELECT
          a.id as artist_id,
          COUNT(*) as prev_streams
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN song_artists sa ON sa.song_id = s.id
        JOIN artists a ON a.id = sa.artist_id
        WHERE sh.played_at BETWEEN $4 AND $5
        GROUP BY a.id
      ),
      artist_trends AS (
        SELECT
          a.id as artist_id,
          date_trunc('day', sh.played_at) as period,
          COUNT(*) as daily_streams
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN song_artists sa ON sa.song_id = s.id
        JOIN artists a ON a.id = sa.artist_id
        WHERE sh.played_at BETWEEN $1 AND $2
        GROUP BY a.id, period
      ),
      aggregated_trends AS (
        SELECT
          artist_id,
          array_agg(daily_streams ORDER BY period) as trend
        FROM artist_trends
        GROUP BY artist_id
      )
      SELECT
        cas.artist_id as "artistId",
        cas.display_name as "displayName",
        cas.total_streams::integer as "totalStreams",
        cas.unique_listeners::integer as "uniqueListeners",
        cas.avg_streams_per_listener::numeric as "avgStreamsPerListener",
        CASE
          WHEN COALESCE(pas.prev_streams, 0) > 0
          THEN ((cas.total_streams::numeric - COALESCE(pas.prev_streams, 0)) / pas.prev_streams * 100)
          WHEN COALESCE(pas.prev_streams, 0) = 0 AND cas.total_streams > 0
          THEN 100.0
          ELSE 0
        END as "growthPercent",
        COALESCE(at.trend, ARRAY[]::integer[]) as trend
      FROM current_artist_streams cas
      LEFT JOIN previous_artist_streams pas ON pas.artist_id = cas.artist_id
      LEFT JOIN aggregated_trends at ON at.artist_id = cas.artist_id
      ORDER BY cas.total_streams DESC
      LIMIT $6
      `,
      [
        timeRange.startDate,
        timeRange.endDate,
        minStreams,
        prevStart.toISOString(),
        prevEnd.toISOString(),
        limit,
      ]
    );

    console.log(
      "🎤 Artist performance data returned:",
      artistsData.length,
      "artists"
    );
    if (artistsData.length > 0) {
      console.log("📊 Sample artist:", artistsData[0]);
    }

    return artistsData.map((artist) => ({
      artistId: artist.artistId,
      displayName: artist.displayName,
      totalStreams: artist.totalStreams,
      uniqueListeners: artist.uniqueListeners,
      avgStreamsPerListener:
        typeof artist.avgStreamsPerListener === "string"
          ? parseFloat(artist.avgStreamsPerListener)
          : artist.avgStreamsPerListener || 0,
      growthPercent:
        typeof artist.growthPercent === "string"
          ? parseFloat(artist.growthPercent)
          : artist.growthPercent || 0,
      trend: artist.trend || [],
    }));
  }

  /**
   * Get Churn Metrics
   */
  static async getChurnMetrics(params: DataReportParams): Promise<any> {
    const { timeRange, granularity = "week" } = params;
    const inactiveDays = 30; // Consider users inactive if no stream in 30 days

    const churnData = await query(
      `
      WITH active_users AS (
        SELECT DISTINCT user_id
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
      ),
      all_users AS (
        SELECT id as user_id, created_at
        FROM users
        WHERE created_at < $2
          AND NOT EXISTS (SELECT 1 FROM deleted_users du WHERE du.user_id = users.id)
      ),
      last_stream_dates AS (
        SELECT
          au.user_id,
          MAX(sh.played_at) as last_stream
        FROM all_users au
        LEFT JOIN song_history sh ON sh.user_id = au.user_id
        GROUP BY au.user_id
      ),
      churn_analysis AS (
        SELECT
          COUNT(*) FILTER (WHERE last_stream IS NULL OR last_stream < ($2::timestamp - interval '${inactiveDays} days')) as inactive_users,
          COUNT(*) FILTER (
            WHERE last_stream >= ($1::timestamp - interval '${inactiveDays} days')
            AND last_stream < $1
          ) as reactivated_users,
          AVG(EXTRACT(EPOCH FROM ($2::timestamp - last_stream)) / 86400) FILTER (WHERE last_stream IS NOT NULL) as avg_days_since_last
        FROM last_stream_dates
      ),
      period_churn AS (
        SELECT
          date_trunc($3, period) as period,
          COUNT(*) FILTER (WHERE became_inactive) as churned,
          COUNT(*) FILTER (WHERE reactivated) as reactivated
        FROM (
          SELECT
            generate_series($1::timestamp, $2::timestamp, ('1 ' || $3)::interval) as period,
            user_id,
            MAX(played_at) < (generate_series($1::timestamp, $2::timestamp, ('1 ' || $3)::interval) - interval '${inactiveDays} days') as became_inactive,
            MAX(played_at) >= (generate_series($1::timestamp, $2::timestamp, ('1 ' || $3)::interval) - interval '${inactiveDays} days') as reactivated
          FROM song_history
          GROUP BY user_id, period
        ) sub
        GROUP BY period
      )
      SELECT
        (SELECT inactive_users FROM churn_analysis) as inactive_users,
        (SELECT reactivated_users FROM churn_analysis) as reactivated_users,
        (SELECT avg_days_since_last FROM churn_analysis) as avg_days_since_last,
        (SELECT COUNT(*) FROM all_users) as total_users
      `,
      [timeRange.startDate, timeRange.endDate, granularity]
    );

    const result = churnData[0] || {};
    const inactiveUsers = parseInt(result.inactive_users) || 0;
    const totalUsers = parseInt(result.total_users) || 1;
    const churnRate = (inactiveUsers / totalUsers) * 100;
    const reactivatedUsers = parseInt(result.reactivated_users) || 0;
    const avgDays = parseFloat(result.avg_days_since_last) || 0;

    const story = `Out of ${totalUsers.toLocaleString()} total users, ${inactiveUsers.toLocaleString()} (${churnRate.toFixed(
      1
    )}%) have been inactive for more than ${inactiveDays} days. ${
      reactivatedUsers > 0
        ? `However, ${reactivatedUsers.toLocaleString()} previously inactive users returned during this period.`
        : ""
    } On average, users last streamed ${avgDays.toFixed(1)} days ago.`;

    return {
      timeRange,
      churnRate,
      inactiveUsers,
      reactivatedUsers,
      avgDaysSinceLastStream: avgDays,
      churnByPeriod: [],
      story,
    };
  }

  /**
   * Get Engagement Time Series Data
   */
  static async getEngagementTimeSeries(
    params: DataReportParams
  ): Promise<any[]> {
    const { timeRange, granularity = "day" } = params;

    console.log(
      "📊 [DATA SERVICE] getEngagementTimeSeries called with params:",
      {
        timeRange,
        granularity,
      }
    );

    const timeseriesData = await query(
      `
      WITH periods AS (
        SELECT date_trunc($3, generate_series(
          $1::timestamp,
          $2::timestamp,
          ('1 ' || $3)::interval
        )) as period
      ),
      stream_data AS (
        SELECT
          date_trunc($3, played_at) as period,
          COUNT(*) as streams
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY date_trunc($3, played_at)
      ),
      like_data AS (
        SELECT
          date_trunc($3, liked_at) as period,
          COUNT(*) as likes
        FROM song_likes
        WHERE liked_at BETWEEN $1 AND $2
        GROUP BY date_trunc($3, liked_at)
      ),
      comment_data AS (
        SELECT
          date_trunc($3, commented_at) as period,
          COUNT(*) as comments
        FROM comments
        WHERE commented_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_comments dc WHERE dc.comment_id = comments.id)
        GROUP BY date_trunc($3, commented_at)
      )
      SELECT
        p.period::text,
        COALESCE(sd.streams, 0)::integer as streams,
        COALESCE(ld.likes, 0)::integer as likes,
        COALESCE(cd.comments, 0)::integer as comments,
        (COALESCE(ld.likes, 0) + COALESCE(cd.comments, 0))::numeric /
          NULLIF(COALESCE(sd.streams, 0), 0) * 100 as "engagementRate"
      FROM periods p
      LEFT JOIN stream_data sd ON sd.period = p.period
      LEFT JOIN like_data ld ON ld.period = p.period
      LEFT JOIN comment_data cd ON cd.period = p.period
      ORDER BY p.period ASC
      `,
      [timeRange.startDate, timeRange.endDate, granularity]
    );

    console.log(
      "📈 [DATA SERVICE] getEngagementTimeSeries returned",
      timeseriesData.length,
      "rows"
    );
    if (timeseriesData.length > 0) {
      console.log("📊 Sample row:", timeseriesData[0]);
    }

    return timeseriesData.map((row) => ({
      period: row.period,
      streams: row.streams,
      likes: row.likes,
      comments: row.comments,
      engagementRate: parseFloat(row.engagementRate) || 0,
    }));
  }

  /**
   * Get Pareto Data for concentration curve
   */
  static async getParetoData(params: DataReportParams): Promise<any[]> {
    const { timeRange, limit = 100 } = params;

    const paretoData = await query(
      `
      WITH song_streams AS (
        SELECT
          s.id,
          s.title,
          COUNT(*) as streams
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
        GROUP BY s.id, s.title
      ),
      ranked_songs AS (
        SELECT
          id,
          title,
          streams,
          SUM(streams) OVER () as total_streams,
          ROW_NUMBER() OVER (ORDER BY streams DESC) as rank,
          COUNT(*) OVER () as total_songs
        FROM song_streams
      ),
      cumulative AS (
        SELECT
          rank,
          title,
          streams,
          total_streams,
          total_songs,
          (rank::numeric / total_songs * 100) as song_percentile,
          (SUM(streams) OVER (ORDER BY rank)::numeric / total_streams * 100) as cumulative_stream_percent
        FROM ranked_songs
      )
      SELECT
        song_percentile as "songPercentile",
        cumulative_stream_percent as "cumulativeStreamPercent",
        title as "songTitle",
        streams::integer
      FROM cumulative
      WHERE rank <= $3
      ORDER BY rank
      `,
      [timeRange.startDate, timeRange.endDate, limit]
    );

    return paretoData.map((row) => ({
      songPercentile: parseFloat(row.songPercentile),
      cumulativeStreamPercent: parseFloat(row.cumulativeStreamPercent),
      songTitle: row.songTitle,
      streams: row.streams,
    }));
  }

  /**
   * Get Detailed Period Data for complex table
   */
  static async getDetailedPeriodData(
    params: DataReportParams
  ): Promise<DetailedPeriodData[]> {
    const {
      timeRange,
      granularity = "day",
      sortBy = "period",
      sortDirection = "DESC",
      minStreams,
      minUsers,
      limit = 50,
      offset = 0,
    } = params;

    console.log("📊 [DATA SERVICE] getDetailedPeriodData called with params:", {
      timeRange,
      granularity,
      sortBy,
      sortDirection,
      minStreams,
      minUsers,
      limit,
      offset,
    });

    const validSortColumns = [
      "period",
      "activeUsers",
      "totalStreams",
      "uniqueSongs",
      "engagementRate",
      "newUsers",
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "period";

    const detailedData = await query(
      `
      WITH periods AS (
        SELECT date_trunc($3, generate_series(
          $1::timestamp,
          $2::timestamp,
          ('1 ' || $3)::interval
        )) as period
      ),
      period_streams AS (
        SELECT
          date_trunc($3, played_at) as period,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_streams,
          COUNT(DISTINCT song_id) as unique_songs
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        GROUP BY date_trunc($3, played_at)
      ),
      period_engagement AS (
        SELECT
          sh.period,
          (COALESCE(likes, 0) + COALESCE(comments, 0))::numeric / NULLIF(sh.total_streams, 0) * 100 as engagement_rate
        FROM (
          SELECT
            date_trunc($3, played_at) as period,
            COUNT(*) as total_streams
          FROM song_history
          WHERE played_at BETWEEN $1 AND $2
          GROUP BY date_trunc($3, played_at)
        ) sh
        LEFT JOIN (
          SELECT
            date_trunc($3, liked_at) as period,
            COUNT(*) as likes
          FROM song_likes
          WHERE liked_at BETWEEN $1 AND $2
          GROUP BY date_trunc($3, liked_at)
        ) sl ON sh.period = sl.period
        LEFT JOIN (
          SELECT
            date_trunc($3, commented_at) as period,
            COUNT(*) as comments
          FROM comments
          WHERE commented_at BETWEEN $1 AND $2
          GROUP BY date_trunc($3, commented_at)
        ) c ON sh.period = c.period
      ),
      period_new_users AS (
        SELECT
          date_trunc($3, created_at) as period,
          COUNT(*) as new_users
        FROM users
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY date_trunc($3, created_at)
      ),
      period_top_content AS (
        SELECT DISTINCT ON (period)
          date_trunc($3, sh.played_at) as period,
          a.display_name as top_artist,
          s.title as top_song
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        LEFT JOIN song_artists sa ON sa.song_id = s.id
        LEFT JOIN artists a ON a.id = sa.artist_id
        WHERE sh.played_at BETWEEN $1 AND $2
        GROUP BY date_trunc($3, sh.played_at), a.display_name, s.title
        ORDER BY period, COUNT(*) DESC
      )
      SELECT
        p.period::text,
        COALESCE(ps.active_users, 0)::integer as "activeUsers",
        COALESCE(ps.total_streams, 0)::integer as "totalStreams",
        COALESCE(ps.unique_songs, 0)::integer as "uniqueSongs",
        COALESCE(pe.engagement_rate, 0)::numeric as "engagementRate",
        COALESCE(pnu.new_users, 0)::integer as "newUsers",
        COALESCE(ptc.top_artist, 'N/A') as "topArtist",
        COALESCE(ptc.top_song, 'N/A') as "topSong"
      FROM periods p
      LEFT JOIN period_streams ps ON ps.period = p.period
      LEFT JOIN period_engagement pe ON pe.period = p.period
      LEFT JOIN period_new_users pnu ON pnu.period = p.period
      LEFT JOIN period_top_content ptc ON ptc.period = p.period
      WHERE 1=1
        ${
          minStreams !== undefined && minStreams > 0
            ? `AND COALESCE(ps.total_streams, 0) >= ${minStreams}`
            : ""
        }
        ${
          minUsers !== undefined && minUsers > 0
            ? `AND COALESCE(ps.active_users, 0) >= ${minUsers}`
            : ""
        }
      ORDER BY "${sortColumn}" ${sortDirection}
      LIMIT $4 OFFSET $5
      `,
      [timeRange.startDate, timeRange.endDate, granularity, limit, offset]
    );

    console.log(
      "📈 [DATA SERVICE] getDetailedPeriodData query returned",
      detailedData.length,
      "rows (limit:",
      limit,
      "offset:",
      offset,
      ")"
    );
    if (detailedData.length > 0) {
      console.log("📊 Sample row:", detailedData[0]);
    }

    return detailedData.map((row) => ({
      period: row.period,
      activeUsers: row.activeUsers,
      totalStreams: row.totalStreams,
      uniqueSongs: row.uniqueSongs,
      engagementRate: parseFloat(row.engagementRate),
      newUsers: row.newUsers,
      topArtist: row.topArtist,
      topSong: row.topSong,
    }));
  }

  /**
   * Get Enhanced Track Performance with FULL dynamic filtering and parameterization
   * Task 5.9 - Supports ALL filter parameters with proper SQL parameterization
   */
  static async getEnhancedTrackPerformance(
    params: DataReportParams
  ): Promise<any[]> {
    const {
      timeRange,
      limit = 50,
      offset = 0,
      minStreams = 10,
      minEngagementRate,
      minGrowthPercent,
      searchTerm,
      artistIds,
      genres,
      albumIds,
      sortBy = "streams",
      sortDirection = "DESC",
      showOnlyNew,
      showOnlyTrending,
      dateRangeFilter,
    } = params;

    console.log(
      "🎵 [DATA SERVICE] getEnhancedTrackPerformance called with FULL params:",
      {
        timeRange,
        limit,
        offset,
        minStreams,
        minEngagementRate,
        minGrowthPercent,
        searchTerm,
        artistIds: artistIds?.length || 0,
        genres: genres?.length || 0,
        albumIds: albumIds?.length || 0,
        sortBy,
        sortDirection,
        showOnlyNew,
        showOnlyTrending,
        dateRangeFilter,
      }
    );

    // Build dynamic WHERE clauses with parameterized queries
    const whereConditions: string[] = [];
    const queryParams: any[] = [
      timeRange.startDate,
      timeRange.endDate,
      minStreams,
    ];
    let paramIndex = 4;

    // Search term filter (searches both title and artist name)
    if (searchTerm && searchTerm.trim()) {
      whereConditions.push(
        `(ct.title ILIKE $${paramIndex} OR ct.artist_name ILIKE $${paramIndex})`
      );
      queryParams.push(`%${searchTerm.trim()}%`);
      paramIndex++;
    }

    // Artist IDs filter
    if (artistIds && artistIds.length > 0) {
      // Artist filter is applied in CTE, not in WHERE clause
      queryParams.push(artistIds);
      paramIndex++;
    }

    // Genres filter
    if (genres && genres.length > 0) {
      whereConditions.push(`ct.genre = ANY($${paramIndex})`);
      queryParams.push(genres);
      paramIndex++;
    }

    // Album IDs filter
    if (albumIds && albumIds.length > 0) {
      // Album filter is applied in CTE, not in WHERE clause
      queryParams.push(albumIds);
      paramIndex++;
    }

    // Date range filter for first streamed
    if (dateRangeFilter) {
      whereConditions.push(
        `ct.first_streamed BETWEEN $${paramIndex} AND $${paramIndex + 1}`
      );
      queryParams.push(dateRangeFilter.startDate, dateRangeFilter.endDate);
      paramIndex += 2;
    }

    // Show only new tracks (first streamed in last 30 days)
    if (showOnlyNew) {
      whereConditions.push(`ct.first_streamed >= NOW() - INTERVAL '30 days'`);
    }

    // Engagement rate filter
    if (minEngagementRate !== undefined && minEngagementRate > 0) {
      whereConditions.push(
        `((COALESCE(te.likes, 0) + COALESCE(tc.comments, 0))::numeric / NULLIF(ct.streams, 0) * 100) >= ${minEngagementRate}`
      );
    }

    // Growth percent filter
    if (minGrowthPercent !== undefined && minGrowthPercent > 0) {
      whereConditions.push(`(
        CASE
          WHEN COALESCE(pt.prev_streams, 0) > 0
          THEN ((ct.streams::numeric - COALESCE(pt.prev_streams, 0)) / pt.prev_streams * 100)
          WHEN COALESCE(pt.prev_streams, 0) = 0 AND ct.streams > 0
          THEN 100.0
          ELSE 0
        END
      ) >= ${minGrowthPercent}`);
    }

    // Show only trending (growth > 20%)
    if (showOnlyTrending) {
      whereConditions.push(`(
        CASE
          WHEN COALESCE(pt.prev_streams, 0) > 0
          THEN ((ct.streams::numeric - COALESCE(pt.prev_streams, 0)) / pt.prev_streams * 100)
          WHEN COALESCE(pt.prev_streams, 0) = 0 AND ct.streams > 0
          THEN 100.0
          ELSE 0
        END
      ) >= 20`);
    }

    // Valid sort columns
    const validSortColumns = [
      "streams",
      "unique_listeners",
      "likes",
      "comments",
      "engagementRate",
      "growthPercent",
      "first_streamed",
      "title",
      "artist_name",
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "streams";
    const sortDir = sortDirection === "ASC" ? "ASC" : "DESC";

    // Add limit and offset to params
    queryParams.push(limit, offset);
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;

    // Build artist filter clause for CTE
    const artistFilterCTE =
      artistIds && artistIds.length > 0
        ? `AND sa.artist_id = ANY($${
            queryParams.indexOf(artistIds) + 1
          }::uuid[])`
        : "";

    // Build genre filter clause for CTE
    const genreFilterCTE =
      genres && genres.length > 0
        ? `AND s.genre = ANY($${queryParams.indexOf(genres) + 1})`
        : "";

    // Build album filter clause for CTE
    const albumFilterCTE =
      albumIds && albumIds.length > 0
        ? `AND als.album_id = ANY($${
            queryParams.indexOf(albumIds) + 1
          }::uuid[])`
        : "";

    const enhancedTracks = await query(
      `
      WITH current_tracks AS (
        SELECT
          sh.song_id,
          s.title,
          s.genre,
          STRING_AGG(DISTINCT a.display_name, ', ') as artist_name,
          STRING_AGG(DISTINCT a.id::text, ',') as artist_ids,
          al.title as album_title,
          al.id as album_id,
          COUNT(*) as streams,
          COUNT(DISTINCT sh.user_id) as unique_listeners,
          MIN(sh.played_at) as first_streamed
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        LEFT JOIN song_artists sa ON sa.song_id = s.id
        LEFT JOIN artists a ON a.id = sa.artist_id
        LEFT JOIN album_songs als ON als.song_id = s.id
        LEFT JOIN albums al ON al.id = als.album_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
          ${artistFilterCTE}
          ${genreFilterCTE}
          ${albumFilterCTE}
        GROUP BY sh.song_id, s.title, s.genre, al.title, al.id
        HAVING COUNT(*) >= $3
      ),
      track_engagement AS (
        SELECT
          song_id,
          COUNT(*) as likes
        FROM song_likes
        WHERE liked_at BETWEEN $1 AND $2
        GROUP BY song_id
      ),
      track_comments AS (
        SELECT
          song_id,
          COUNT(*) as comments
        FROM comments
        WHERE commented_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_comments dc WHERE dc.comment_id = comments.id)
        GROUP BY song_id
      ),
      previous_tracks AS (
        SELECT
          song_id,
          COUNT(*) as prev_streams
        FROM song_history
        WHERE played_at < $1
          AND played_at >= $1::timestamp - ($2::timestamp - $1::timestamp)
        GROUP BY song_id
      )
      SELECT
        ct.song_id as "songId",
        ct.title,
        ct.artist_name as "artistName",
        ct.album_title as "albumTitle",
        ct.genre,
        ct.streams::integer,
        ct.unique_listeners::integer as "uniqueListeners",
        COALESCE(te.likes, 0)::integer as likes,
        COALESCE(tc.comments, 0)::integer as comments,
        ((COALESCE(te.likes, 0) + COALESCE(tc.comments, 0))::numeric / 
          NULLIF(ct.streams, 0) * 100) as "engagementRate",
        CASE
          WHEN COALESCE(pt.prev_streams, 0) > 0
          THEN ((ct.streams::numeric - COALESCE(pt.prev_streams, 0)) / pt.prev_streams * 100)
          WHEN COALESCE(pt.prev_streams, 0) = 0 AND ct.streams > 0
          THEN 100.0
          ELSE 0
        END as "growthPercent",
        ct.first_streamed::text as "firstStreamedDate"
      FROM current_tracks ct
      LEFT JOIN track_engagement te ON te.song_id = ct.song_id
      LEFT JOIN track_comments tc ON tc.song_id = ct.song_id
      LEFT JOIN previous_tracks pt ON pt.song_id = ct.song_id
      WHERE 1=1
        ${
          whereConditions.length > 0
            ? "AND " + whereConditions.join(" AND ")
            : ""
        }
      ORDER BY 
        CASE WHEN '${sortColumn}' = 'streams' THEN ct.streams END ${sortDir},
        CASE WHEN '${sortColumn}' = 'unique_listeners' THEN ct.unique_listeners END ${sortDir},
        CASE WHEN '${sortColumn}' = 'likes' THEN COALESCE(te.likes, 0) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'comments' THEN COALESCE(tc.comments, 0) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'engagementRate' THEN ((COALESCE(te.likes, 0) + COALESCE(tc.comments, 0))::numeric / NULLIF(ct.streams, 0) * 100) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'growthPercent' THEN (
          CASE
            WHEN COALESCE(pt.prev_streams, 0) > 0
            THEN ((ct.streams::numeric - COALESCE(pt.prev_streams, 0)) / pt.prev_streams * 100)
            WHEN COALESCE(pt.prev_streams, 0) = 0 AND ct.streams > 0
            THEN 100.0
            ELSE 0
          END
        ) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'first_streamed' THEN ct.first_streamed END ${sortDir},
        CASE WHEN '${sortColumn}' = 'title' THEN ct.title END ${sortDir},
        CASE WHEN '${sortColumn}' = 'artist_name' THEN ct.artist_name END ${sortDir},
        ct.streams DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
      `,
      queryParams
    );

    console.log(
      "🎵 Enhanced track performance returned",
      enhancedTracks.length,
      "tracks with filters:",
      {
        appliedFilters: whereConditions.length,
        totalParams: queryParams.length,
      }
    );
    if (enhancedTracks.length > 0) {
      console.log("📊 Sample track:", enhancedTracks[0]);
    }

    return enhancedTracks.map((track) => ({
      songId: track.songId,
      title: track.title,
      artistName: track.artistName || "Unknown Artist",
      albumTitle: track.albumTitle || "-",
      genre: track.genre || "Unknown Genre",
      streams: track.streams,
      uniqueListeners: track.uniqueListeners,
      likes: track.likes,
      comments: track.comments,
      engagementRate: parseFloat(track.engagementRate) || 0,
      growthPercent: parseFloat(track.growthPercent) || 0,
      firstStreamedDate: track.firstStreamedDate,
    }));
  }

  /**
   * Get Artist Filter Options for dropdowns
   */
  static async getArtistFilterOptions(): Promise<any[]> {
    console.log("🎤 [DATA SERVICE] getArtistFilterOptions called");

    const artists = await query(
      `
      SELECT 
        id,
        display_name as name
      FROM artists
      WHERE NOT EXISTS (SELECT 1 FROM deleted_artists da WHERE da.artist_id = artists.id)
      ORDER BY display_name ASC
      `
    );

    return artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
    }));
  }

  /**
   * Get Genre Filter Options for dropdowns
   */
  static async getGenreFilterOptions(): Promise<string[]> {
    console.log("🎵 [DATA SERVICE] getGenreFilterOptions called");

    const genres = await query(
      `
      SELECT DISTINCT genre
      FROM songs
      WHERE genre IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = songs.id)
      ORDER BY genre ASC
      `
    );

    return genres.map((row) => row.genre);
  }

  /**
   * Get Album Filter Options for dropdowns
   */
  static async getAlbumFilterOptions(): Promise<any[]> {
    console.log("💿 [DATA SERVICE] getAlbumFilterOptions called");

    const albums = await query(
      `
      SELECT 
        al.id,
        al.title,
        a.display_name as artist_name
      FROM albums al
      LEFT JOIN artists a ON a.id = al.owner_id
      WHERE NOT EXISTS (SELECT 1 FROM deleted_albums da WHERE da.album_id = al.id)
      ORDER BY al.title ASC
      LIMIT 500
      `
    );

    return albums.map((album) => ({
      id: album.id,
      title: album.title,
      artistName: album.artist_name || "Unknown Artist",
    }));
  }

  /**
   * Get Genre Breakdown with streams and listener metrics
   */
  static async getGenreBreakdown(params: DataReportParams): Promise<any[]> {
    const { timeRange } = params;

    console.log("🎵 [DATA SERVICE] getGenreBreakdown called with:", {
      timeRange,
    });

    const genreData = await query(
      `
      WITH genre_stats AS (
        SELECT
          s.genre,
          COUNT(*) as streams,
          COUNT(DISTINCT sh.user_id) as unique_listeners
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND s.genre IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
        GROUP BY s.genre
      ),
      total_streams AS (
        SELECT SUM(streams) as total
        FROM genre_stats
      )
      SELECT
        gs.genre,
        gs.streams::integer,
        gs.unique_listeners::integer as "uniqueListeners",
        (gs.streams::numeric / NULLIF(ts.total, 0) * 100) as "percentOfTotal"
      FROM genre_stats gs
      CROSS JOIN total_streams ts
      ORDER BY gs.streams DESC
      `,
      [timeRange.startDate, timeRange.endDate]
    );

    console.log("🎵 Genre breakdown returned", genreData.length, "genres");
    if (genreData.length > 0) {
      console.log("📊 Sample genre:", genreData[0]);
    }

    return genreData.map((row) => ({
      genre: row.genre,
      streams: row.streams,
      uniqueListeners: row.uniqueListeners,
      percentOfTotal: parseFloat(row.percentOfTotal) || 0,
    }));
  }

  /**
   * Get comprehensive per-user analytics with extensive metrics
   */
  static async getUserAnalytics(params: DataReportParams): Promise<any[]> {
    const {
      timeRange,
      limit = 50,
      offset = 0,
      sortBy = "totalStreams",
      sortDirection = "DESC",
      searchTerm,
      minStreams,
    } = params;

    console.log("👥 [DATA SERVICE] getUserAnalytics called with:", {
      timeRange,
      limit,
      offset,
      sortBy,
      sortDirection,
      searchTerm,
      minStreams,
    });

    // Build WHERE conditions
    const whereConditions: string[] = [];
    const queryParams: any[] = [timeRange.startDate, timeRange.endDate];
    let paramIndex = 3;

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      whereConditions.push(`u.username ILIKE $${paramIndex}`);
      queryParams.push(`%${searchTerm.trim()}%`);
      paramIndex++;
    }

    // Min streams filter
    if (minStreams && minStreams > 0) {
      whereConditions.push(`COALESCE(us.total_streams, 0) >= ${minStreams}`);
    }

    // Valid sort columns
    const validSortColumns = [
      "totalStreams",
      "uniqueSongsPlayed",
      "uniqueArtistsPlayed",
      "totalLikes",
      "totalComments",
      "engagementScore",
      "avgStreamsPerDay",
      "daysSinceJoined",
      "lastActiveAt",
      "username",
    ];
    const sortColumn = validSortColumns.includes(sortBy)
      ? sortBy
      : "totalStreams";
    const sortDir = sortDirection === "ASC" ? "ASC" : "DESC";

    queryParams.push(limit, offset);
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;

    const userData = await query(
      `
      WITH user_streams AS (
        SELECT
          sh.user_id,
          COUNT(*) as total_streams,
          COUNT(DISTINCT sh.song_id) as unique_songs,
          COUNT(DISTINCT sa.artist_id) as unique_artists,
          MAX(sh.played_at) as last_active
        FROM song_history sh
        LEFT JOIN song_artists sa ON sa.song_id = sh.song_id
        WHERE sh.played_at BETWEEN $1 AND $2
        GROUP BY sh.user_id
      ),
      user_engagement AS (
        SELECT
          user_id,
          COUNT(*) as total_likes
        FROM song_likes
        WHERE liked_at BETWEEN $1 AND $2
        GROUP BY user_id
      ),
      user_comments AS (
        SELECT
          user_id,
          COUNT(*) as total_comments
        FROM comments
        WHERE commented_at BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM deleted_comments dc WHERE dc.comment_id = comments.id)
        GROUP BY user_id
      ),
      user_social AS (
        SELECT
          follower_id as user_id,
          COUNT(*) as following_count
        FROM user_followers
        WHERE followed_at <= $2
        GROUP BY follower_id
      ),
      user_followers_count AS (
        SELECT
          following_id,
          COUNT(*) as followers_count
        FROM user_followers
        WHERE followed_at <= $2
        GROUP BY following_id
      ),
      user_playlists AS (
        SELECT
          owner_id as user_id,
          COUNT(*) as playlists_count
        FROM playlists
        WHERE created_at <= $2
          AND NOT EXISTS (SELECT 1 FROM deleted_playlists dp WHERE dp.playlist_id = playlists.id)
        GROUP BY owner_id
      )
      SELECT
        u.id as "userId",
        u.username,
        u.username as "displayName",
        u.profile_picture_url as "profileImageUrl",
        u.created_at::text as "joinedAt",
        COALESCE(us.total_streams, 0)::integer as "totalStreams",
        COALESCE(us.unique_songs, 0)::integer as "uniqueSongsPlayed",
        COALESCE(us.unique_artists, 0)::integer as "uniqueArtistsPlayed",
        COALESCE(ue.total_likes, 0)::integer as "totalLikes",
        COALESCE(uc.total_comments, 0)::integer as "totalComments",
        COALESCE(uso.following_count, 0)::integer as "totalFollowing",
        COALESCE(ufo.followers_count, 0)::integer as "totalFollowers",
        COALESCE(up.playlists_count, 0)::integer as "playlistsCreated",
        CASE
          WHEN EXTRACT(EPOCH FROM ($2::timestamp - $1::timestamp)) / 86400 > 0
          THEN (COALESCE(us.total_streams, 0)::numeric / (EXTRACT(EPOCH FROM ($2::timestamp - $1::timestamp)) / 86400))
          ELSE 0
        END as "avgStreamsPerDay",
        COALESCE(us.last_active, u.created_at)::text as "lastActiveAt",
        EXTRACT(DAY FROM ($2::timestamp - u.created_at))::integer as "daysSinceJoined",
        (
          COALESCE(us.total_streams, 0) * 1.0 +
          COALESCE(ue.total_likes, 0) * 2.0 +
          COALESCE(uc.total_comments, 0) * 3.0 +
          COALESCE(up.playlists_count, 0) * 5.0
        ) as "engagementScore"
      FROM users u
      LEFT JOIN user_streams us ON us.user_id = u.id
      LEFT JOIN user_engagement ue ON ue.user_id = u.id
      LEFT JOIN user_comments uc ON uc.user_id = u.id
      LEFT JOIN user_social uso ON uso.user_id = u.id
      LEFT JOIN user_followers_count ufo ON ufo.following_id = u.id
      LEFT JOIN user_playlists up ON up.user_id = u.id
      WHERE NOT EXISTS (SELECT 1 FROM deleted_users du WHERE du.user_id = u.id)
        ${
          whereConditions.length > 0
            ? "AND " + whereConditions.join(" AND ")
            : ""
        }
      ORDER BY
        CASE WHEN '${sortColumn}' = 'totalStreams' THEN COALESCE(us.total_streams, 0) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'uniqueSongsPlayed' THEN COALESCE(us.unique_songs, 0) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'uniqueArtistsPlayed' THEN COALESCE(us.unique_artists, 0) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'totalLikes' THEN COALESCE(ue.total_likes, 0) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'totalComments' THEN COALESCE(uc.total_comments, 0) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'engagementScore' THEN (
          COALESCE(us.total_streams, 0) * 1.0 +
          COALESCE(ue.total_likes, 0) * 2.0 +
          COALESCE(uc.total_comments, 0) * 3.0 +
          COALESCE(up.playlists_count, 0) * 5.0
        ) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'avgStreamsPerDay' THEN (
          CASE
            WHEN EXTRACT(EPOCH FROM ($2::timestamp - $1::timestamp)) / 86400 > 0
            THEN (COALESCE(us.total_streams, 0)::numeric / (EXTRACT(EPOCH FROM ($2::timestamp - $1::timestamp)) / 86400))
            ELSE 0
          END
        ) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'daysSinceJoined' THEN EXTRACT(DAY FROM ($2::timestamp - u.created_at)) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'lastActiveAt' THEN COALESCE(us.last_active, u.created_at) END ${sortDir},
        CASE WHEN '${sortColumn}' = 'username' THEN u.username END ${sortDir},
        COALESCE(us.total_streams, 0) DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
      `,
      queryParams
    );

    console.log("👥 User analytics returned", userData.length, "users");
    if (userData.length > 0) {
      console.log("📊 Sample user:", userData[0]);
    }

    return userData.map((user) => ({
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl,
      joinedAt: user.joinedAt,
      totalStreams: user.totalStreams,
      uniqueSongsPlayed: user.uniqueSongsPlayed,
      uniqueArtistsPlayed: user.uniqueArtistsPlayed,
      totalLikes: user.totalLikes,
      totalComments: user.totalComments,
      totalFollowing: user.totalFollowing,
      totalFollowers: user.totalFollowers,
      playlistsCreated: user.playlistsCreated,
      avgStreamsPerDay: parseFloat(user.avgStreamsPerDay) || 0,
      lastActiveAt: user.lastActiveAt,
      daysSinceJoined: user.daysSinceJoined,
      engagementScore: parseFloat(user.engagementScore) || 0,
    }));
  }

  /**
   * Get Peak Activity Hour across all history tables
   */
  static async getPeakActivityHour(
    params: DataReportParams
  ): Promise<{ hour: number; totalActivity: number }> {
    const { timeRange } = params;

    const peakHourData = await query(
      `
      WITH all_activity AS (
        SELECT EXTRACT(HOUR FROM played_at) as hour
        FROM song_history
        WHERE played_at BETWEEN $1 AND $2
        UNION ALL
        SELECT EXTRACT(HOUR FROM played_at) as hour
        FROM album_history
        WHERE played_at BETWEEN $1 AND $2
        UNION ALL
        SELECT EXTRACT(HOUR FROM played_at) as hour
        FROM playlist_history
        WHERE played_at BETWEEN $1 AND $2
        UNION ALL
        SELECT EXTRACT(HOUR FROM played_at) as hour
        FROM artist_history
        WHERE played_at BETWEEN $1 AND $2
      )
      SELECT
        hour,
        COUNT(*) as total_activity
      FROM all_activity
      GROUP BY hour
      ORDER BY total_activity DESC
      LIMIT 1
      `,
      [timeRange.startDate, timeRange.endDate]
    );

    console.log(
      parseInt(peakHourData[0].hour),
      parseInt(peakHourData[0].total_activity)
    );

    return {
      hour: parseInt(peakHourData[0].hour),
      totalActivity: parseInt(peakHourData[0].total_activity),
    };
  }
}
