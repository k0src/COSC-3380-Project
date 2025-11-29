import type {
  DataReportParams,
  ExecutiveOverviewData,
  ExecutiveSummary,
  KPIMetric,
  UserGrowthData,
  RetentionCohort,
  EngagementMetrics,
  ArtistPerformance,
  ActivityTimelineData,
  GenreBreakdownData,
  KpisData,
  DetailedPeriodData,
  ChurnMetrics,
  EnhancedTrackData,
  UserAnalyticsData,
} from "@types";
import { notDeletedCondition } from "@util";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage";

export default class DataService {
  static async getExecutiveSummaryData(
    params: DataReportParams
  ): Promise<ExecutiveSummary> {
    const { timeRange } = params;
    const kpisData = await this.getKpisData(params);
    const summary = this.generateExecutiveSummary(kpisData.kpis, timeRange);
    return summary;
  }

  private static generateExecutiveSummary(
    kpis: ExecutiveOverviewData["kpis"],
    timeRange: { startDate: string; endDate: string }
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
    };
  }

  static async getKpisData(params: DataReportParams): Promise<KpisData> {
    const {
      timeRange,
      compareTo = "previous_period",
      granularity = "day",
    } = params;

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

    const activeUsersData = await query(
      `
    WITH current_period AS (
      SELECT COUNT(DISTINCT sh.user_id) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
    ),
    previous_period AS (
      SELECT COUNT(DISTINCT sh.user_id) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $3 AND $4
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
    ),
    trend_data AS (
      SELECT
        date_trunc($5, sh.played_at) as period,
        COUNT(DISTINCT sh.user_id) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
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

    const totalStreamsData = await query(
      `
    WITH current_period AS (
      SELECT COUNT(*) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
    ),
    previous_period AS (
      SELECT COUNT(*) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $3 AND $4
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
    ),
    trend_data AS (
      SELECT
        date_trunc($5, sh.played_at) as period,
        COUNT(*) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
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

    const uniqueSongsData = await query(
      `
    WITH current_period AS (
      SELECT COUNT(DISTINCT sh.song_id) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
    ),
    previous_period AS (
      SELECT COUNT(DISTINCT sh.song_id) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $3 AND $4
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
    ),
    trend_data AS (
      SELECT
        date_trunc($5, sh.played_at) as period,
        COUNT(DISTINCT sh.song_id) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
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

    const avgStreamsData = await query(
      `
    WITH current_period AS (
      SELECT
        COUNT(*)::numeric / NULLIF(COUNT(DISTINCT sh.user_id), 0) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
    ),
    previous_period AS (
      SELECT
        COUNT(*)::numeric / NULLIF(COUNT(DISTINCT sh.user_id), 0) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $3 AND $4
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
    ),
    trend_data AS (
      SELECT
        date_trunc($5, sh.played_at) as period,
        COUNT(*)::numeric / NULLIF(COUNT(DISTINCT sh.user_id), 0) as value
      FROM song_history sh
      JOIN users u ON u.id = sh.user_id
      JOIN songs s ON s.id = sh.song_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("song", "s")}
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

    const engagementData = await query(
      `
    WITH current_period AS (
      SELECT
        ((SELECT COUNT(*) 
          FROM song_likes sl
          JOIN users u ON u.id = sl.user_id
          JOIN songs s ON s.id = sl.song_id
          WHERE sl.liked_at BETWEEN $1 AND $2
            AND ${notDeletedCondition("user", "u")}
            AND ${notDeletedCondition("song", "s")}
        ) +
         (SELECT COUNT(*) 
          FROM comments c
          JOIN users u ON u.id = c.user_id
          JOIN songs s ON s.id = c.song_id
          WHERE c.commented_at BETWEEN $1 AND $2
            AND ${notDeletedCondition("comment", "c")}
            AND ${notDeletedCondition("user", "u")}
            AND ${notDeletedCondition("song", "s")}
        ))::numeric /
        NULLIF((SELECT COUNT(*) 
          FROM song_history sh
          JOIN users u ON u.id = sh.user_id
          JOIN songs s ON s.id = sh.song_id
          WHERE sh.played_at BETWEEN $1 AND $2
            AND ${notDeletedCondition("user", "u")}
            AND ${notDeletedCondition("song", "s")}
        ), 0) * 100 as value
    ),
    previous_period AS (
      SELECT
        ((SELECT COUNT(*) 
          FROM song_likes sl
          JOIN users u ON u.id = sl.user_id
          JOIN songs s ON s.id = sl.song_id
          WHERE sl.liked_at BETWEEN $3 AND $4
            AND ${notDeletedCondition("user", "u")}
            AND ${notDeletedCondition("song", "s")}
        ) +
         (SELECT COUNT(*) 
          FROM comments c
          JOIN users u ON u.id = c.user_id
          JOIN songs s ON s.id = c.song_id
          WHERE c.commented_at BETWEEN $3 AND $4
            AND ${notDeletedCondition("comment", "c")}
            AND ${notDeletedCondition("user", "u")}
            AND ${notDeletedCondition("song", "s")}
        ))::numeric /
        NULLIF((SELECT COUNT(*) 
          FROM song_history sh
          JOIN users u ON u.id = sh.user_id
          JOIN songs s ON s.id = sh.song_id
          WHERE sh.played_at BETWEEN $3 AND $4
            AND ${notDeletedCondition("user", "u")}
            AND ${notDeletedCondition("song", "s")}
        ), 0) * 100 as value
    ),
    trend_data AS (
      SELECT
        sh.period,
        (COALESCE(sl.likes, 0) + COALESCE(c.comments, 0))::numeric / NULLIF(sh.streams, 0) * 100 as value
      FROM (
        SELECT
          date_trunc($5, sh.played_at) as period,
          COUNT(*) as streams
        FROM song_history sh
        JOIN users u ON u.id = sh.user_id
        JOIN songs s ON s.id = sh.song_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("user", "u")}
          AND ${notDeletedCondition("song", "s")}
        GROUP BY date_trunc($5, sh.played_at)
      ) sh
      LEFT JOIN (
        SELECT
          date_trunc($5, sl.liked_at) as period,
          COUNT(*) as likes
        FROM song_likes sl
        JOIN users u ON u.id = sl.user_id
        JOIN songs s ON s.id = sl.song_id
        WHERE sl.liked_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("user", "u")}
          AND ${notDeletedCondition("song", "s")}
        GROUP BY date_trunc($5, sl.liked_at)
      ) sl ON sh.period = sl.period
      LEFT JOIN (
        SELECT
          date_trunc($5, c.commented_at) as period,
          COUNT(*) as comments
        FROM comments c
        JOIN users u ON u.id = c.user_id
        JOIN songs s ON s.id = c.song_id
        WHERE c.commented_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("comment", "c")}
          AND ${notDeletedCondition("user", "u")}
          AND ${notDeletedCondition("song", "s")}
        GROUP BY date_trunc($5, c.commented_at)
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

    const createKPIMetric = (label: string, data: any): KPIMetric => {
      const currentValue = parseFloat(data.current_value) ?? 0;
      const previousValue = parseFloat(data.previous_value) ?? 0;
      const delta = currentValue - previousValue;

      let deltaPercent = 0;
      if (previousValue > 0) {
        deltaPercent = (delta / previousValue) * 100;
      } else if (previousValue === 0 && currentValue > 0) {
        deltaPercent = 100;
      }

      const trend = data.trend ?? [];
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
    return { timeRange, kpis };
  }

  static async getUserGrowthData(
    params: DataReportParams
  ): Promise<UserGrowthData[]> {
    const { timeRange, granularity = "week" } = params;
    const growthData = await query<UserGrowthData>(
      `WITH period_data AS (
        SELECT
          date_trunc($3, u.created_at) as period,
          COUNT(*) as new_users
        FROM users u
        WHERE u.created_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("user", "u")}
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
      ORDER BY period ASC`,
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
      sortBy = "cohortWeek",
      sortDirection = "DESC",
    } = params;
    const limit = Number(params.limit) || 10;
    const offset = Number(params.offset) ?? 0;
    const cohortTrunc = cohortBy === "signup_month" ? "month" : "week";
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
    const orderByClause = `${orderByColumn} ${orderDirection}`;

    const retentionCohorts = await query<RetentionCohort>(
      `WITH cohorts AS (
        SELECT
          date_trunc($3, u.created_at) as cohort_week,
          u.id as user_id
        FROM users u
        WHERE u.created_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("user", "u")}
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
            WHEN sh.played_at BETWEEN u.created_at AND u.created_at + interval '1 day'
            THEN sh.user_id
          END) as day1,
          COUNT(DISTINCT CASE
            WHEN sh.played_at BETWEEN u.created_at AND u.created_at + interval '7 days'
            THEN sh.user_id
          END) as day7,
          COUNT(DISTINCT CASE
            WHEN sh.played_at BETWEEN u.created_at AND u.created_at + interval '14 days'
            THEN sh.user_id
          END) as day14,
          COUNT(DISTINCT CASE
            WHEN sh.played_at BETWEEN u.created_at AND u.created_at + interval '28 days'
            THEN sh.user_id
          END) as day28,
          COUNT(DISTINCT CASE
            WHEN sh.played_at BETWEEN u.created_at AND u.created_at + interval '90 days'
            THEN sh.user_id
          END) as day90
        FROM cohorts c
        JOIN users u ON u.id = c.user_id
        LEFT JOIN song_history sh ON sh.user_id = c.user_id
        LEFT JOIN songs s ON s.id = sh.song_id
        WHERE (sh.song_id IS NULL OR ${notDeletedCondition("song", "s")})
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
      ORDER BY ${orderByClause}
      LIMIT $4
      OFFSET $5`,
      [timeRange.startDate, timeRange.endDate, cohortTrunc, limit, offset]
    );
    return retentionCohorts;
  }

  static async getAverageTimeToFirstStream(params: DataReportParams): Promise<{
    averageTimeToFirstStream: number;
    usersWithoutStreams: number;
  }> {
    const { timeRange } = params;
    const avgTimeData = await query<{
      avg_hours: string;
      users_with_streams: string;
      users_without_streams: string;
    }>(
      `WITH first_streams AS (
        SELECT
          u.id as user_id,
          u.created_at,
          MIN(sh.played_at) as first_stream
        FROM users u
        LEFT JOIN song_history sh ON sh.user_id = u.id
        LEFT JOIN songs s ON s.id = sh.song_id
        WHERE u.created_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("user", "u")}
          AND (sh.song_id IS NULL OR ${notDeletedCondition("song", "s")})
        GROUP BY u.id, u.created_at
      )
      SELECT
        AVG(EXTRACT(EPOCH FROM (first_stream - created_at)) / 3600) as avg_hours,
        COUNT(*) FILTER (WHERE first_stream IS NOT NULL) as users_with_streams,
        COUNT(*) FILTER (WHERE first_stream IS NULL) as users_without_streams
      FROM first_streams`,
      [timeRange.startDate, timeRange.endDate]
    );
    const averageTimeToFirstStream = parseFloat(
      avgTimeData[0]?.avg_hours ?? "0"
    );
    const usersWithoutStreams = parseInt(
      avgTimeData[0]?.users_without_streams ?? "0"
    );
    return {
      averageTimeToFirstStream,
      usersWithoutStreams,
    };
  }

  static async getEngagementMetrics(
    params: DataReportParams
  ): Promise<EngagementMetrics> {
    const { timeRange, limit = 50, minStreams = 10 } = params;

    const topTracksData = await query(
      `WITH current_streams AS (
        SELECT
          sh.song_id,
          s.title,
          STRING_AGG(DISTINCT a.display_name, ', ') as artist_name,
          COUNT(*) as streams,
          COUNT(DISTINCT sh.user_id) as unique_listeners
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        LEFT JOIN song_artists sa ON sa.song_id = s.id
        LEFT JOIN artists a ON a.id = sa.artist_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
          AND (sa.artist_id IS NULL OR ${notDeletedCondition("artist", "a")})
        GROUP BY sh.song_id, s.title
        HAVING COUNT(*) >= $3
      ),
      previous_streams AS (
        SELECT
          sh.song_id,
          COUNT(*) as prev_streams
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        WHERE sh.played_at < $1
          AND sh.played_at >= $1::timestamp - ($2::timestamp - $1::timestamp)
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        GROUP BY sh.song_id
      ),
      trend_data AS (
        SELECT
          sh.song_id,
          date_trunc('day', sh.played_at) as period,
          COUNT(*) as daily_streams
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        GROUP BY sh.song_id, period
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
      LIMIT $4`,
      [timeRange.startDate, timeRange.endDate, minStreams, limit]
    );

    const concentrationData = await query(
      `WITH song_streams AS (
        SELECT
          sh.song_id,
          COUNT(*) as streams
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        GROUP BY sh.song_id
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
      FROM cumulative`,
      [timeRange.startDate, timeRange.endDate]
    );

    const concentration = {
      top1Percent: parseFloat(concentrationData[0]?.top_1_percent) ?? 0,
      top10Percent: parseFloat(concentrationData[0]?.top_10_percent) ?? 0,
      top50Percent: parseFloat(concentrationData[0]?.top_50_percent) ?? 0,
    };

    const sessionData = await query(
      `WITH daily_sessions AS (
        SELECT
          sh.user_id,
          DATE(sh.played_at) as session_date,
          MAX(sh.played_at) - MIN(sh.played_at) as session_length
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        GROUP BY sh.user_id, DATE(sh.played_at)
        HAVING COUNT(*) > 1
      )
      SELECT AVG(EXTRACT(EPOCH FROM session_length) / 60) as avg_minutes
      FROM daily_sessions`,
      [timeRange.startDate, timeRange.endDate]
    );

    const averageSessionLength = parseFloat(sessionData[0]?.avg_minutes) ?? 0;

    const topTracks = topTracksData.map((track) => ({
      songId: track.songId,
      title: track.title,
      artistName: track.artistName || "Unknown Artist",
      streams: track.streams,
      uniqueListeners: track.uniqueListeners,
      growthPercent: parseFloat(track.growthPercent) ?? 0,
      trend: track.trend ?? [],
    }));

    return {
      timeRange,
      topTracks,
      concentration,
      averageSessionLength,
    };
  }

  static async getActivityTimeline(
    params: DataReportParams
  ): Promise<ActivityTimelineData[]> {
    const { timeRange, granularity = "day" } = params;
    const timelineData = await query<ActivityTimelineData>(
      `WITH periods AS (
        SELECT date_trunc($3, generate_series(
          $1::timestamp,
          $2::timestamp,
          ('1 ' || $3)::interval
        )) as period
      ),
      stream_data AS (
        SELECT
          date_trunc($3, sh.played_at) as period,
          COUNT(*) as streams
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        GROUP BY date_trunc($3, sh.played_at)
      ),
      like_data AS (
        SELECT
          date_trunc($3, sl.liked_at) as period,
          COUNT(*) as likes
        FROM song_likes sl
        JOIN songs s ON s.id = sl.song_id
        JOIN users u ON u.id = sl.user_id
        WHERE sl.liked_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        GROUP BY date_trunc($3, sl.liked_at)
      ),
      comment_data AS (
        SELECT
          date_trunc($3, c.commented_at) as period,
          COUNT(*) as comments
        FROM comments c
        JOIN songs s ON s.id = c.song_id
        JOIN users u ON u.id = c.user_id
        WHERE c.commented_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("comment", "c")}
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        GROUP BY date_trunc($3, c.commented_at)
      ),
      follower_data AS (
        SELECT
          date_trunc($3, uf.followed_at) as period,
          COUNT(*) as followers
        FROM user_followers uf
        JOIN users u_follower ON u_follower.id = uf.follower_id
        JOIN users u_following ON u_following.id = uf.following_id
        WHERE uf.followed_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("user", "u_follower")}
          AND ${notDeletedCondition("user", "u_following")}
        GROUP BY date_trunc($3, uf.followed_at)
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
      ORDER BY p.period ASC`,
      [timeRange.startDate, timeRange.endDate, granularity]
    );
    return timelineData;
  }

  static async getChurnMetrics(
    params: DataReportParams
  ): Promise<ChurnMetrics> {
    const { timeRange, granularity = "week" } = params;
    const inactiveDays = 30;
    const churnData = await query(
      `WITH active_users AS (
        SELECT DISTINCT sh.user_id
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        ),
      all_users AS (
        SELECT u.id as user_id, u.created_at
        FROM users u
        WHERE u.created_at < $2
          AND ${notDeletedCondition("user", "u")}
      ),
      last_stream_dates AS (
        SELECT
          au.user_id,
          MAX(sh.played_at) as last_stream
        FROM all_users au
        LEFT JOIN song_history sh ON sh.user_id = au.user_id
        LEFT JOIN songs s ON s.id = sh.song_id
        WHERE (sh.song_id IS NULL OR ${notDeletedCondition("song", "s")})
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
            sh.user_id,
            MAX(sh.played_at) < (generate_series($1::timestamp, $2::timestamp, ('1 ' || $3)::interval) - interval '${inactiveDays} days') as became_inactive,
            MAX(sh.played_at) >= (generate_series($1::timestamp, $2::timestamp, ('1 ' || $3)::interval) - interval '${inactiveDays} days') as reactivated
          FROM song_history sh
          JOIN songs s ON s.id = sh.song_id
          JOIN users u ON u.id = sh.user_id
          WHERE ${notDeletedCondition("song", "s")}
            AND ${notDeletedCondition("user", "u")}
          GROUP BY sh.user_id, period
        ) sub
        GROUP BY period
      )
      SELECT
        (SELECT inactive_users FROM churn_analysis) as inactive_users,
        (SELECT reactivated_users FROM churn_analysis) as reactivated_users,
        (SELECT avg_days_since_last FROM churn_analysis) as avg_days_since_last,
        (SELECT COUNT(*) FROM all_users) as total_users`,
      [timeRange.startDate, timeRange.endDate, granularity]
    );
    const result = churnData[0] || {};
    const inactiveUsers = parseInt(result.inactive_users) ?? 0;
    const totalUsers = parseInt(result.total_users) || 1;
    const churnRate = (inactiveUsers / totalUsers) * 100;
    const reactivatedUsers = parseInt(result.reactivated_users) ?? 0;
    const avgDays = parseFloat(result.avg_days_since_last) ?? 0;
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
      `WITH periods AS (
        SELECT date_trunc($3, generate_series(
          $1::timestamp,
          $2::timestamp,
          ('1 ' || $3)::interval
        )) as period
      ),
      period_streams AS (
        SELECT
          date_trunc($3, sh.played_at) as period,
          COUNT(DISTINCT sh.user_id) as active_users,
          COUNT(*) as total_streams,
          COUNT(DISTINCT sh.song_id) as unique_songs
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        GROUP BY date_trunc($3, sh.played_at)
      ),
      period_engagement AS (
        SELECT
          sh.period,
          (COALESCE(likes, 0) + COALESCE(comments, 0))::numeric / NULLIF(sh.total_streams, 0) * 100 as engagement_rate
        FROM (
          SELECT
            date_trunc($3, sh.played_at) as period,
            COUNT(*) as total_streams
          FROM song_history sh
          JOIN songs s ON s.id = sh.song_id
          JOIN users u ON u.id = sh.user_id
          WHERE sh.played_at BETWEEN $1 AND $2
            AND ${notDeletedCondition("song", "s")}
            AND ${notDeletedCondition("user", "u")}
          GROUP BY date_trunc($3, sh.played_at)
        ) sh
        LEFT JOIN (
          SELECT
            date_trunc($3, sl.liked_at) as period,
            COUNT(*) as likes
          FROM song_likes sl
          JOIN songs s ON s.id = sl.song_id
          JOIN users u ON u.id = sl.user_id
          WHERE sl.liked_at BETWEEN $1 AND $2
            AND ${notDeletedCondition("song", "s")}
            AND ${notDeletedCondition("user", "u")}
          GROUP BY date_trunc($3, sl.liked_at)
        ) sl ON sh.period = sl.period
        LEFT JOIN (
          SELECT
            date_trunc($3, c.commented_at) as period,
            COUNT(*) as comments
          FROM comments c
          JOIN songs s ON s.id = c.song_id
          JOIN users u ON u.id = c.user_id
          WHERE c.commented_at BETWEEN $1 AND $2
            AND ${notDeletedCondition("comment", "c")}
            AND ${notDeletedCondition("song", "s")}
            AND ${notDeletedCondition("user", "u")}
          GROUP BY date_trunc($3, c.commented_at)
        ) c ON sh.period = c.period
      ),
      period_new_users AS (
        SELECT
          date_trunc($3, u.created_at) as period,
          COUNT(*) as new_users
        FROM users u
        WHERE u.created_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("user", "u")}
        GROUP BY date_trunc($3, u.created_at)
      ),
      period_top_content AS (
        SELECT DISTINCT ON (period)
          date_trunc($3, sh.played_at) as period,
          a.display_name as top_artist,
          s.title as top_song
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        LEFT JOIN song_artists sa ON sa.song_id = s.id
        LEFT JOIN artists a ON a.id = sa.artist_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
          AND (sa.artist_id IS NULL OR ${notDeletedCondition("artist", "a")})
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

    return detailedData.map((row) => ({
      period: row.period,
      activeUsers: row.activeUsers,
      totalStreams: row.totalStreams,
      uniqueSongs: row.uniqueSongs,
      engagementRate: parseFloat(row.engagementRate) ?? 0,
      newUsers: row.newUsers,
      topArtist: row.topArtist,
      topSong: row.topSong,
    }));
  }

  static async getArtistPerformanceMetrics(
    params: DataReportParams
  ): Promise<ArtistPerformance[]> {
    const {
      timeRange,
      limit = 1000,
      offset = 0,
      minStreams,
      minEngagementRate,
      minGrowthPercent,
      searchTerm,
      artistIds,
      genres,
      albumIds,
      sortBy = "totalStreams",
      sortDirection = "DESC",
      showOnlyNew,
      showOnlyTrending,
    } = params;

    const currentStart = new Date(timeRange.startDate);
    const currentEnd = new Date(timeRange.endDate);
    const daysDiff =
      (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24);
    const prevEnd = new Date(currentStart);
    prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    const prevStart = new Date(
      prevEnd.getTime() - daysDiff * 24 * 60 * 60 * 1000
    );

    const sortColumnMap: Record<string, string> = {
      displayName: '"displayName"',
      totalStreams: '"totalStreams"',
      uniqueListeners: '"uniqueListeners"',
      avgStreamsPerListener: '"avgStreamsPerListener"',
      engagementRate: '"engagementRate"',
      growthPercent: '"growthPercent"',
    };

    const orderByColumn = sortColumnMap[sortBy] || '"totalStreams"';
    const orderByDirection = sortDirection === "ASC" ? "ASC" : "DESC";

    const whereConditions: string[] = [];

    if (minStreams !== undefined && minStreams > 0) {
      whereConditions.push(`"totalStreams" >= ${minStreams}`);
    }

    if (minEngagementRate !== undefined && minEngagementRate > 0) {
      whereConditions.push(`"engagementRate" >= ${minEngagementRate}`);
    }

    if (minGrowthPercent !== undefined && minGrowthPercent > 0) {
      whereConditions.push(`"growthPercent" >= ${minGrowthPercent}`);
    }

    if (searchTerm && searchTerm.trim()) {
      whereConditions.push(`"displayName" ILIKE '%${searchTerm.trim()}%'`);
    }

    if (artistIds && artistIds.length > 0) {
      whereConditions.push(
        `"artistId" = ANY(ARRAY[${artistIds
          .map((id) => `'${id}'`)
          .join(",")}]::uuid[])`
      );
    }

    if (genres && genres.length > 0) {
      whereConditions.push(
        `genres && ARRAY[${genres.map((g) => `'${g}'`).join(",")}]::text[]`
      );
    }

    if (albumIds && albumIds.length > 0) {
      whereConditions.push(
        `album_ids && ARRAY[${albumIds
          .map((id) => `'${id}'`)
          .join(",")}]::uuid[]`
      );
    }

    if (showOnlyNew) {
      whereConditions.push(`first_stream_date >= NOW() - INTERVAL '30 days'`);
    }

    if (showOnlyTrending) {
      whereConditions.push(`"growthPercent" >= 20`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const artistsData = await query<ArtistPerformance>(
      `WITH all_artist_streams AS (
      SELECT
        a.id as artist_id,
        a.display_name,
        COUNT(*) as total_streams,
        COUNT(DISTINCT sh.user_id) as unique_listeners,
        COUNT(*)::numeric / NULLIF(COUNT(DISTINCT sh.user_id), 0) as avg_streams_per_listener,
        MIN(sh.played_at) as first_stream_date,
        ARRAY_AGG(DISTINCT s.genre) FILTER (WHERE s.genre IS NOT NULL) as genres,
        ARRAY_AGG(DISTINCT als.album_id) FILTER (WHERE als.album_id IS NOT NULL) as album_ids
      FROM song_history sh
      JOIN songs s ON s.id = sh.song_id
      JOIN users u ON u.id = sh.user_id
      JOIN song_artists sa ON sa.song_id = s.id
      JOIN artists a ON a.id = sa.artist_id
      LEFT JOIN album_songs als ON als.song_id = s.id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("song", "s")}
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("artist", "a")}
      GROUP BY a.id, a.display_name
    ),
    artist_engagement AS (
      SELECT
        aas.artist_id,
        (
          (SELECT COUNT(*) FROM song_likes sl
           JOIN songs s2 ON s2.id = sl.song_id
           JOIN song_artists sa2 ON sa2.song_id = s2.id
           WHERE sa2.artist_id = aas.artist_id 
             AND sl.liked_at BETWEEN $1 AND $2
             AND ${notDeletedCondition("song", "s2")}
          ) +
          (SELECT COUNT(*) FROM comments c
           JOIN songs s3 ON s3.id = c.song_id
           JOIN song_artists sa3 ON sa3.song_id = s3.id
           WHERE sa3.artist_id = aas.artist_id 
             AND c.commented_at BETWEEN $1 AND $2
             AND ${notDeletedCondition("comment", "c")}
             AND ${notDeletedCondition("song", "s3")}
          )
        )::numeric / NULLIF(aas.total_streams, 0) * 100 as engagement_rate
      FROM all_artist_streams aas
    ),
    previous_artist_streams AS (
      SELECT
        a.id as artist_id,
        COUNT(*) as prev_streams
      FROM song_history sh
      JOIN songs s ON s.id = sh.song_id
      JOIN users u ON u.id = sh.user_id
      JOIN song_artists sa ON sa.song_id = s.id
      JOIN artists a ON a.id = sa.artist_id
      WHERE sh.played_at BETWEEN $3 AND $4
        AND ${notDeletedCondition("song", "s")}
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("artist", "a")}
      GROUP BY a.id
    ),
    artist_trends AS (
      SELECT
        a.id as artist_id,
        date_trunc('day', sh.played_at) as period,
        COUNT(*) as daily_streams
      FROM song_history sh
      JOIN songs s ON s.id = sh.song_id
      JOIN users u ON u.id = sh.user_id
      JOIN song_artists sa ON sa.song_id = s.id
      JOIN artists a ON a.id = sa.artist_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("song", "s")}
        AND ${notDeletedCondition("user", "u")}
        AND ${notDeletedCondition("artist", "a")}
      GROUP BY a.id, period
    ),
    aggregated_trends AS (
      SELECT
        artist_id,
        array_agg(daily_streams ORDER BY period) as trend
      FROM artist_trends
      GROUP BY artist_id
    ),
    final_data AS (
      SELECT
        aas.artist_id as "artistId",
        aas.display_name as "displayName",
        aas.total_streams::integer as "totalStreams",
        aas.unique_listeners::integer as "uniqueListeners",
        aas.avg_streams_per_listener::numeric as "avgStreamsPerListener",
        COALESCE(ae.engagement_rate, 0)::numeric as "engagementRate",
        CASE
          WHEN COALESCE(pas.prev_streams, 0) > 0
          THEN ((aas.total_streams::numeric - COALESCE(pas.prev_streams, 0)) / pas.prev_streams * 100)
          WHEN COALESCE(pas.prev_streams, 0) = 0 AND aas.total_streams > 0
          THEN 100.0
          ELSE 0
        END as "growthPercent",
        COALESCE(at.trend, ARRAY[]::integer[]) as trend,
        aas.first_stream_date,
        aas.genres,
        aas.album_ids
      FROM all_artist_streams aas
      LEFT JOIN artist_engagement ae ON ae.artist_id = aas.artist_id
      LEFT JOIN previous_artist_streams pas ON pas.artist_id = aas.artist_id
      LEFT JOIN aggregated_trends at ON at.artist_id = aas.artist_id
    )
    SELECT 
      "artistId",
      "displayName",
      "totalStreams",
      "uniqueListeners",
      "avgStreamsPerListener",
      "engagementRate",
      "growthPercent",
      trend
    FROM final_data
    ${whereClause}
    ORDER BY ${orderByColumn} ${orderByDirection}
    LIMIT $5 OFFSET $6`,
      [
        timeRange.startDate,
        timeRange.endDate,
        prevStart.toISOString(),
        prevEnd.toISOString(),
        limit,
        offset,
      ]
    );

    return artistsData.map((artist) => ({
      artistId: artist.artistId,
      displayName: artist.displayName,
      totalStreams: artist.totalStreams,
      uniqueListeners: artist.uniqueListeners,
      avgStreamsPerListener:
        typeof artist.avgStreamsPerListener === "string"
          ? parseFloat(artist.avgStreamsPerListener)
          : artist.avgStreamsPerListener ?? 0,
      engagementRate:
        typeof artist.engagementRate === "string"
          ? parseFloat(artist.engagementRate)
          : artist.engagementRate ?? 0,
      growthPercent:
        typeof artist.growthPercent === "string"
          ? parseFloat(artist.growthPercent)
          : artist.growthPercent ?? 0,
      trend: artist.trend ?? [],
    }));
  }

  static async getEnhancedTrackPerformance(
    params: DataReportParams
  ): Promise<EnhancedTrackData[]> {
    const {
      timeRange,
      limit = 1000,
      offset = 0,
      minStreams,
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

    const currentStart = new Date(timeRange.startDate);
    const currentEnd = new Date(timeRange.endDate);
    const daysDiff =
      (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24);
    const prevEnd = new Date(currentStart);
    prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    const prevStart = new Date(
      prevEnd.getTime() - daysDiff * 24 * 60 * 60 * 1000
    );

    const sortColumnMap: Record<string, string> = {
      streams: '"streams"',
      unique_listeners: '"uniqueListeners"',
      likes: "likes",
      comments: "comments",
      engagementRate: '"engagementRate"',
      growthPercent: '"growthPercent"',
      first_streamed: '"firstStreamedDate"',
      title: "title",
      artist_name: '"artistName"',
    };

    const orderByColumn = sortColumnMap[sortBy] || '"streams"';
    const orderByDirection = sortDirection === "ASC" ? "ASC" : "DESC";

    const whereConditions: string[] = [];

    if (minStreams !== undefined && minStreams > 0) {
      whereConditions.push(`"streams" >= ${minStreams}`);
    }

    if (minEngagementRate !== undefined && minEngagementRate > 0) {
      whereConditions.push(`"engagementRate" >= ${minEngagementRate}`);
    }

    if (minGrowthPercent !== undefined && minGrowthPercent > 0) {
      whereConditions.push(`"growthPercent" >= ${minGrowthPercent}`);
    }

    if (searchTerm && searchTerm.trim()) {
      whereConditions.push(
        `(title ILIKE '%${searchTerm.trim()}%' OR "artistName" ILIKE '%${searchTerm.trim()}%')`
      );
    }

    if (artistIds && artistIds.length > 0) {
      whereConditions.push(
        `artist_ids && ARRAY[${artistIds
          .map((id) => `'${id}'`)
          .join(",")}]::uuid[]`
      );
    }

    if (genres && genres.length > 0) {
      whereConditions.push(
        `genre = ANY(ARRAY[${genres.map((g) => `'${g}'`).join(",")}])`
      );
    }

    if (albumIds && albumIds.length > 0) {
      whereConditions.push(
        `album_id = ANY(ARRAY[${albumIds
          .map((id) => `'${id}'`)
          .join(",")}]::uuid[])`
      );
    }

    if (dateRangeFilter) {
      whereConditions.push(
        `"firstStreamedDate"::timestamp BETWEEN '${dateRangeFilter.startDate}' AND '${dateRangeFilter.endDate}'`
      );
    }

    if (showOnlyNew) {
      whereConditions.push(
        `"firstStreamedDate"::timestamp >= NOW() - INTERVAL '30 days'`
      );
    }

    if (showOnlyTrending) {
      whereConditions.push(`"growthPercent" >= 20`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const enhancedTracks = await query(
      `WITH all_tracks AS (
      SELECT
        sh.song_id,
        s.title,
        s.genre,
        STRING_AGG(DISTINCT a.display_name, ', ') as artist_name,
        ARRAY_AGG(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL) as artist_ids,
        (ARRAY_AGG(DISTINCT al.title))[1] as album_title,
        (ARRAY_AGG(DISTINCT al.id) FILTER (WHERE al.id IS NOT NULL))[1] as album_id,
        COUNT(*) as streams,
        COUNT(DISTINCT sh.user_id) as unique_listeners,
        MIN(sh.played_at) as first_streamed
      FROM song_history sh
      JOIN songs s ON s.id = sh.song_id
      JOIN users u ON u.id = sh.user_id
      LEFT JOIN song_artists sa ON sa.song_id = s.id
      LEFT JOIN artists a ON a.id = sa.artist_id
      LEFT JOIN album_songs als ON als.song_id = s.id
      LEFT JOIN albums al ON al.id = als.album_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("song", "s")}
        AND ${notDeletedCondition("user", "u")}
        AND (sa.artist_id IS NULL OR ${notDeletedCondition("artist", "a")})
        AND (als.album_id IS NULL OR ${notDeletedCondition("album", "al")})
      GROUP BY sh.song_id, s.title, s.genre
    ),
    track_engagement AS (
      SELECT
        sl.song_id,
        COUNT(*) as likes
      FROM song_likes sl
      JOIN songs s ON s.id = sl.song_id
      JOIN users u ON u.id = sl.user_id
      WHERE sl.liked_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("song", "s")}
        AND ${notDeletedCondition("user", "u")}
      GROUP BY sl.song_id
    ),
    track_comments AS (
      SELECT
        c.song_id,
        COUNT(*) as comments
      FROM comments c
      JOIN songs s ON s.id = c.song_id
      JOIN users u ON u.id = c.user_id
      WHERE c.commented_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("comment", "c")}
        AND ${notDeletedCondition("song", "s")}
        AND ${notDeletedCondition("user", "u")}
      GROUP BY c.song_id
    ),
    previous_tracks AS (
      SELECT
        sh.song_id,
        COUNT(*) as prev_streams
      FROM song_history sh
      JOIN songs s ON s.id = sh.song_id
      JOIN users u ON u.id = sh.user_id
      WHERE sh.played_at BETWEEN $3 AND $4
        AND ${notDeletedCondition("song", "s")}
        AND ${notDeletedCondition("user", "u")}
      GROUP BY sh.song_id
    ),
    final_data AS (
      SELECT
        at.song_id as "songId",
        at.title,
        at.artist_name as "artistName",
        at.album_title as "albumTitle",
        at.genre,
        at.streams::integer as "streams",
        at.unique_listeners::integer as "uniqueListeners",
        COALESCE(te.likes, 0)::integer as likes,
        COALESCE(tc.comments, 0)::integer as comments,
        ((COALESCE(te.likes, 0) + COALESCE(tc.comments, 0))::numeric / 
          NULLIF(at.streams, 0) * 100) as "engagementRate",
        CASE
          WHEN COALESCE(pt.prev_streams, 0) > 0
          THEN ((at.streams::numeric - COALESCE(pt.prev_streams, 0)) / pt.prev_streams * 100)
          WHEN COALESCE(pt.prev_streams, 0) = 0 AND at.streams > 0
          THEN 100.0
          ELSE 0
        END as "growthPercent",
        at.first_streamed::text as "firstStreamedDate",
        at.artist_ids,
        at.album_id
      FROM all_tracks at
      LEFT JOIN track_engagement te ON te.song_id = at.song_id
      LEFT JOIN track_comments tc ON tc.song_id = at.song_id
      LEFT JOIN previous_tracks pt ON pt.song_id = at.song_id
    )
    SELECT
      "songId",
      title,
      "artistName",
      "albumTitle",
      genre,
      "streams",
      "uniqueListeners",
      likes,
      comments,
      "engagementRate",
      "growthPercent",
      "firstStreamedDate"
    FROM final_data
    ${whereClause}
    ORDER BY ${orderByColumn} ${orderByDirection}
    LIMIT $5 OFFSET $6`,
      [
        timeRange.startDate,
        timeRange.endDate,
        prevStart.toISOString(),
        prevEnd.toISOString(),
        limit,
        offset,
      ]
    );

    return enhancedTracks.map((track) => ({
      songId: track.songId ?? "",
      title: track.title ?? "Unknown",
      artistName: track.artistName ?? "Unknown Artist",
      albumTitle: track.albumTitle ?? "-",
      genre: track.genre ?? "Unknown Genre",
      streams: track.streams ?? 0,
      uniqueListeners: track.uniqueListeners ?? 0,
      likes: track.likes ?? 0,
      comments: track.comments ?? 0,
      engagementRate: parseFloat(track.engagementRate) ?? 0,
      growthPercent: parseFloat(track.growthPercent) ?? 0,
      firstStreamedDate: track.firstStreamedDate ?? "",
    }));
  }

  static async getArtistFilterOptions(): Promise<
    Array<{ id: string; name: string }>
  > {
    const artists = await query(
      `SELECT 
        id,
        display_name as name
      FROM artists
      WHERE NOT EXISTS (SELECT 1 FROM deleted_artists da WHERE da.artist_id = artists.id)
      ORDER BY display_name ASC`
    );

    return artists.map((artist) => ({
      id: artist.id,
      name: artist.name ?? "Unknown Artist",
    }));
  }

  static async getGenreFilterOptions(): Promise<string[]> {
    const genres = await query(
      `SELECT DISTINCT genre
      FROM songs
      WHERE genre IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = songs.id)
      ORDER BY genre ASC`
    );

    return genres.map((row) => row.genre);
  }

  static async getAlbumFilterOptions(): Promise<
    Array<{ id: string; title: string; artistName: string }>
  > {
    const albums = await query(
      `SELECT 
        al.id,
        al.title,
        a.display_name as artist_name
      FROM albums al
      LEFT JOIN artists a ON a.id = al.owner_id
      WHERE NOT EXISTS (SELECT 1 FROM deleted_albums da WHERE da.album_id = al.id)
      ORDER BY al.title ASC
      LIMIT 500`
    );

    return albums.map((album) => ({
      id: album.id,
      title: album.title,
      artistName: album.artist_name ?? "Unknown Artist",
    }));
  }

  static async getGenreBreakdown(
    params: DataReportParams
  ): Promise<GenreBreakdownData[]> {
    const { timeRange } = params;
    const genreData = await query(
      `WITH genre_stats AS (
        SELECT
          s.genre,
          COUNT(*) as streams,
          COUNT(DISTINCT sh.user_id) as unique_listeners
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND s.genre IS NOT NULL
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
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
      ORDER BY gs.streams DESC`,
      [timeRange.startDate, timeRange.endDate]
    );
    return genreData.map((row) => ({
      genre: row.genre,
      streams: row.streams,
      uniqueListeners: row.uniqueListeners,
      percentOfTotal: parseFloat(row.percentOfTotal) ?? 0,
    }));
  }

  static async getPeakActivityHour(
    params: DataReportParams
  ): Promise<{ hour: number; totalActivity: number }> {
    const { timeRange } = params;
    const peakHourData = await query(
      `WITH all_activity AS (
        SELECT EXTRACT(HOUR FROM sh.played_at) as hour
        FROM song_history sh
        JOIN songs s ON s.id = sh.song_id
        JOIN users u ON u.id = sh.user_id
        WHERE sh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("song", "s")}
          AND ${notDeletedCondition("user", "u")}
        UNION ALL
        SELECT EXTRACT(HOUR FROM ah.played_at) as hour
        FROM album_history ah
        JOIN albums a ON a.id = ah.album_id
        JOIN users u ON u.id = ah.user_id
        WHERE ah.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("album", "a")}
          AND ${notDeletedCondition("user", "u")}
        UNION ALL
        SELECT EXTRACT(HOUR FROM ph.played_at) as hour
        FROM playlist_history ph
        JOIN playlists p ON p.id = ph.playlist_id
        JOIN users u ON u.id = ph.user_id
        WHERE ph.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("playlist", "p")}
          AND ${notDeletedCondition("user", "u")}
        UNION ALL
        SELECT EXTRACT(HOUR FROM arh.played_at) as hour
        FROM artist_history arh
        JOIN artists ar ON ar.id = arh.artist_id
        JOIN users u ON u.id = arh.user_id
        WHERE arh.played_at BETWEEN $1 AND $2
          AND ${notDeletedCondition("artist", "ar")}
          AND ${notDeletedCondition("user", "u")}
      )
      SELECT
        hour,
        COUNT(*) as total_activity
      FROM all_activity
      GROUP BY hour
      ORDER BY total_activity DESC
      LIMIT 1`,
      [timeRange.startDate, timeRange.endDate]
    );
    return {
      hour: parseInt(peakHourData[0].hour ?? 0),
      totalActivity: parseInt(peakHourData[0].total_activity ?? 0),
    };
  }

  static async getUserAnalytics(
    params: DataReportParams
  ): Promise<UserAnalyticsData[]> {
    const {
      timeRange,
      limit = 50,
      offset = 0,
      sortBy = "totalStreams",
      sortDirection = "DESC",
      searchTerm,
      minStreams,
    } = params;
    const whereConditions: string[] = [];
    const queryParams: any[] = [timeRange.startDate, timeRange.endDate];
    let paramIndex = 3;

    if (searchTerm && searchTerm.trim()) {
      whereConditions.push(`u.username ILIKE $${paramIndex}`);
      queryParams.push(`%${searchTerm.trim()}%`);
      paramIndex++;
    }

    if (minStreams && minStreams > 0) {
      whereConditions.push(`COALESCE(us.total_streams, 0) >= ${minStreams}`);
    }

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
      JOIN songs s ON s.id = sh.song_id
      LEFT JOIN song_artists sa ON sa.song_id = sh.song_id
      LEFT JOIN artists ar ON ar.id = sa.artist_id
      WHERE sh.played_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("song", "s")}
        AND (sa.artist_id IS NULL OR ${notDeletedCondition("artist", "ar")})
      GROUP BY sh.user_id
    ),
    user_engagement AS (
      SELECT
        sl.user_id,
        COUNT(*) as total_likes
      FROM song_likes sl
      JOIN songs s ON s.id = sl.song_id
      WHERE sl.liked_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("song", "s")}
      GROUP BY sl.user_id
    ),
    user_comments AS (
      SELECT
        c.user_id,
        COUNT(*) as total_comments
      FROM comments c
      JOIN songs s ON s.id = c.song_id
      WHERE c.commented_at BETWEEN $1 AND $2
        AND ${notDeletedCondition("comment", "c")}
        AND ${notDeletedCondition("song", "s")}
      GROUP BY c.user_id
    ),
    user_social AS (
      SELECT
        uf.follower_id as user_id,
        COUNT(*) as following_count
      FROM user_followers uf
      JOIN users u_following ON u_following.id = uf.following_id
      WHERE uf.followed_at <= $2
        AND ${notDeletedCondition("user", "u_following")}
      GROUP BY uf.follower_id
    ),
    user_followers_count AS (
      SELECT
        uf.following_id,
        COUNT(*) as followers_count
      FROM user_followers uf
      JOIN users u_follower ON u_follower.id = uf.follower_id
      WHERE uf.followed_at <= $2
        AND ${notDeletedCondition("user", "u_follower")}
      GROUP BY uf.following_id
    ),
    user_playlists AS (
      SELECT
        p.owner_id as user_id,
        COUNT(*) as playlists_count
      FROM playlists p
      WHERE p.created_at <= $2
        AND ${notDeletedCondition("playlist", "p")}
      GROUP BY p.owner_id
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
    WHERE ${notDeletedCondition("user", "u")}
      ${
        whereConditions.length > 0 ? "AND " + whereConditions.join(" AND ") : ""
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

    return userData.map((user) => ({
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl
        ? getBlobUrl(user.profileImageUrl)
        : null,
      joinedAt: user.joinedAt,
      totalStreams: user.totalStreams,
      uniqueSongsPlayed: user.uniqueSongsPlayed,
      uniqueArtistsPlayed: user.uniqueArtistsPlayed,
      totalLikes: user.totalLikes,
      totalComments: user.totalComments,
      totalFollowing: user.totalFollowing,
      totalFollowers: user.totalFollowers,
      playlistsCreated: user.playlistsCreated,
      avgStreamsPerDay: parseFloat(user.avgStreamsPerDay) ?? 0,
      lastActiveAt: user.lastActiveAt,
      daysSinceJoined: user.daysSinceJoined,
      engagementScore: parseFloat(user.engagementScore) ?? 0,
    }));
  }
}
