import { query } from "../config/database.js";
import type { UUID } from "../types";

export interface DateRange {
  from: string;
  to: string;
}

export class UserBehaviorReportsService {
  /**
   * Get Daily/Monthly Active Users - How many users are actually engaging regularly
   * Parameters:
   * - groupBy: 'daily' | 'monthly' - how to group the data
   * - minStreams: minimum number of streams to be considered active
   */
  static async getDailyMonthlyActiveUsers(
    dateRange: DateRange, 
    groupBy: 'daily' | 'monthly' = 'daily',
    minStreams: number = 1
  ) {
    // Step 1: Get current period data
    const currentPeriodData = await this.getCurrentPeriodData(dateRange, groupBy, minStreams);
    
    // Step 2: Get previous period data for comparison
    const previousPeriodData = await this.getPreviousPeriodData(dateRange, groupBy, minStreams);
    
    // Step 3: Get total registered users
    const totalUsers = await this.getTotalRegisteredUsers(dateRange.to);
    
    // Step 4: Get peak activity data
    const peakActivity = await this.getPeakActivity(dateRange, groupBy, minStreams);
    
    // Step 5: Calculate platform averages
    const platformAverages = await this.calculatePlatformAverages(dateRange, groupBy);
    
    // Step 6: Combine all data
    const enrichedData = currentPeriodData.map((current: any) => {
      const previous = previousPeriodData.find((p: any) => p.period === current.period);
      
      return {
        ...current,
        // Engagement Quality
        avg_streams_per_user: current.active_users > 0 
          ? parseFloat((current.total_streams / current.active_users).toFixed(2))
          : 0,
        
        // Benchmarks
        total_registered_users: totalUsers,
        engagement_rate_percent: totalUsers > 0
          ? parseFloat((current.active_users / totalUsers * 100).toFixed(2))
          : 0,
        
        // Comparison Metrics
        previous_period_active_users: previous?.active_users || 0,
        previous_period_streams: previous?.total_streams || 0,
        user_growth_percent: previous?.active_users > 0
          ? parseFloat(((current.active_users - previous.active_users) / previous.active_users * 100).toFixed(2))
          : null,
        stream_growth_percent: previous?.total_streams > 0
          ? parseFloat(((current.total_streams - previous.total_streams) / previous.total_streams * 100).toFixed(2))
          : null,
        
        // Peak Activity
        peak_period: peakActivity.peak_period,
        peak_active_users: peakActivity.peak_active_users,
        peak_streams: peakActivity.peak_streams,
        percent_of_peak: peakActivity.peak_active_users > 0
          ? parseFloat((current.active_users / peakActivity.peak_active_users * 100).toFixed(2))
          : 0
      };
    });
    
    return {
      results: enrichedData,
      summary: {
        total_periods: enrichedData.length,
        platform_avg_active_users: platformAverages.avg_active_users,
        platform_avg_streams: platformAverages.avg_streams,
        platform_avg_engagement_rate: platformAverages.avg_engagement_rate,
      }
    };
  }
  
  // Helper method: Get current period data
  private static async getCurrentPeriodData(dateRange: DateRange, groupBy: 'daily' | 'monthly', minStreams: number) {
    const dateGrouping = groupBy === 'monthly' 
      ? "TO_CHAR(DATE_TRUNC('month', sh.played_at), 'Month YYYY')" 
      : "DATE(sh.played_at)::text";
    
    const sql = `
      SELECT 
        ${dateGrouping} as period,
        COUNT(DISTINCT sh.user_id) as active_users,
        COUNT(sh.song_id) as total_streams,
        COUNT(DISTINCT sh.song_id) as unique_songs_played
      FROM song_history sh
      WHERE sh.played_at BETWEEN $1 AND $2
      GROUP BY ${groupBy === 'monthly' ? "DATE_TRUNC('month', sh.played_at)" : "DATE(sh.played_at)"}
      HAVING COUNT(sh.song_id) >= $3
      ORDER BY ${groupBy === 'monthly' ? "DATE_TRUNC('month', sh.played_at)" : "DATE(sh.played_at)"} DESC
    `;
    
    const result = await query(sql, [dateRange.from, dateRange.to, minStreams]);
    return result || [];
  }
  
  // Helper method: Get previous period data
  private static async getPreviousPeriodData(dateRange: DateRange, groupBy: 'daily' | 'monthly', minStreams: number) {
    // Calculate previous period range
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    const periodLength = toDate.getTime() - fromDate.getTime();
    
    const previousFrom = new Date(fromDate.getTime() - periodLength).toISOString().split('T')[0];
    const previousTo = new Date(fromDate.getTime() - 86400000).toISOString().split('T')[0]; // 1 day before start
    
    const dateGrouping = groupBy === 'monthly' 
      ? "TO_CHAR(DATE_TRUNC('month', sh.played_at), 'Month YYYY')" 
      : "DATE(sh.played_at)::text";
    
    const sql = `
      SELECT 
        ${dateGrouping} as period,
        COUNT(DISTINCT sh.user_id) as active_users,
        COUNT(sh.song_id) as total_streams
      FROM song_history sh
      WHERE sh.played_at BETWEEN $1 AND $2
      GROUP BY ${groupBy === 'monthly' ? "DATE_TRUNC('month', sh.played_at)" : "DATE(sh.played_at)"}
      HAVING COUNT(sh.song_id) >= $3
    `;
    
    const result = await query(sql, [previousFrom, previousTo, minStreams]);
    return result || [];
  }
  
  // Helper method: Get total registered users
  private static async getTotalRegisteredUsers(asOfDate: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as total
      FROM users
      WHERE created_at <= $1
    `;
    
    const result = await query(sql, [asOfDate]);
    return result?.[0]?.total || 0;
  }
  
  // Helper method: Get peak activity period
  private static async getPeakActivity(dateRange: DateRange, groupBy: 'daily' | 'monthly', minStreams: number) {
    const dateGrouping = groupBy === 'monthly' 
      ? "TO_CHAR(DATE_TRUNC('month', sh.played_at), 'Month YYYY')" 
      : "DATE(sh.played_at)::text";
    
    const sql = `
      SELECT 
        ${dateGrouping} as peak_period,
        COUNT(DISTINCT sh.user_id) as peak_active_users,
        COUNT(sh.song_id) as peak_streams
      FROM song_history sh
      WHERE sh.played_at BETWEEN $1 AND $2
      GROUP BY ${groupBy === 'monthly' ? "DATE_TRUNC('month', sh.played_at)" : "DATE(sh.played_at)"}
      HAVING COUNT(sh.song_id) >= $3
      ORDER BY COUNT(DISTINCT sh.user_id) DESC
      LIMIT 1
    `;
    
    const result = await query(sql, [dateRange.from, dateRange.to, minStreams]);
    return result?.[0] || { peak_period: null, peak_active_users: 0, peak_streams: 0 };
  }
  
  // Helper method: Calculate platform averages
  private static async calculatePlatformAverages(dateRange: DateRange, groupBy: 'daily' | 'monthly') {
    const dateGrouping = groupBy === 'monthly' 
      ? "DATE_TRUNC('month', sh.played_at)"
      : "DATE(sh.played_at)";

    const sql = `
      WITH period_stats AS (
        SELECT 
          ${dateGrouping} as period,
          COUNT(DISTINCT sh.user_id) as active_users,
          COUNT(sh.song_id) as total_streams,
          (SELECT COUNT(*) FROM users WHERE created_at <= MAX(sh.played_at)) as total_users
        FROM song_history sh
        WHERE sh.played_at BETWEEN $1 AND $2
        GROUP BY ${dateGrouping}
      )
      SELECT 
        ROUND(AVG(active_users), 2) as avg_active_users,
        ROUND(AVG(total_streams), 2) as avg_streams,
        ROUND(AVG((active_users::numeric / NULLIF(total_users, 0) * 100)), 2) as avg_engagement_rate
      FROM period_stats
    `;

    const result = await query(sql, [dateRange.from, dateRange.to]);
    return result?.[0] || {
      avg_active_users: 0,
      avg_streams: 0,
      avg_engagement_rate: 0
    };
  }
}

export default UserBehaviorReportsService;