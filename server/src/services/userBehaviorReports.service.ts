import { query } from "../config/database.js";
import type { UUID } from "../types";

export interface DateRange {
  from: string;
  to: string;
}

export class UserBehaviorReportsService {
  /**
   * Tracks user retention by join cohort
   */
  static async getAudienceGrowth(dateRange: DateRange, period: 'days' | 'weeks' | 'months' = 'months') {
    // Set date grouping based on period
    let dateTruncation = "DATE_TRUNC('month', u.created_at)";
    let dateFormat = "TO_CHAR(uc.joined_period, 'Mon YYYY')";
    
    if (period === 'weeks') {
      dateTruncation = "DATE_TRUNC('week', u.created_at)";
      dateFormat = "'Week of ' || TO_CHAR(uc.joined_period, 'Mon DD, YYYY')";
    } else if (period === 'days') {
      dateTruncation = "DATE_TRUNC('day', u.created_at)";
      dateFormat = "TO_CHAR(uc.joined_period, 'Mon DD, YYYY')";
    }
    
    const sql = `
      WITH user_cohorts AS (
        SELECT 
          ${dateTruncation} as joined_period,
          u.id as user_id,
          u.created_at
        FROM users u
        WHERE u.created_at BETWEEN $1 AND $2
      ),
      week1_returns AS (
        SELECT DISTINCT
          uc.joined_period,
          sh.user_id
        FROM user_cohorts uc
        JOIN song_history sh ON uc.user_id = sh.user_id
        WHERE sh.played_at BETWEEN uc.created_at AND uc.created_at + INTERVAL '7 days'
      ),
      week4_returns AS (
        SELECT DISTINCT
          uc.joined_period,
          sh.user_id
        FROM user_cohorts uc
        JOIN song_history sh ON uc.user_id = sh.user_id
        WHERE sh.played_at BETWEEN uc.created_at + INTERVAL '21 days' AND uc.created_at + INTERVAL '28 days'
      ),
      current_month_returns AS (
        SELECT DISTINCT
          uc.joined_period,
          sh.user_id,
          COUNT(sh.song_id) as play_count
        FROM user_cohorts uc
        JOIN song_history sh ON uc.user_id = sh.user_id
        WHERE sh.played_at BETWEEN DATE_TRUNC('month', CURRENT_DATE) AND DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        GROUP BY uc.joined_period, sh.user_id
      ),
      play_stats AS (
        SELECT 
          uc.joined_period,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cmr.play_count) as median_plays,
          AVG(cmr.play_count) as avg_plays,
          COUNT(CASE WHEN cmr.play_count > 10 THEN 1 END) as heavy_listeners
        FROM user_cohorts uc
        LEFT JOIN current_month_returns cmr ON uc.joined_period = cmr.joined_period AND uc.user_id = cmr.user_id
        WHERE cmr.play_count IS NOT NULL
        GROUP BY uc.joined_period
      )
      SELECT 
        ${dateFormat} as joined_in,
        COUNT(DISTINCT uc.user_id) as total_users,
        COUNT(DISTINCT w1.user_id) as returned_week1,
        ROUND(
          (COUNT(DISTINCT w1.user_id)::numeric / NULLIF(COUNT(DISTINCT uc.user_id), 0) * 100), 
          1
        ) as week1_retention_percent,
        COUNT(DISTINCT w4.user_id) as returned_week4,
        ROUND(
          (COUNT(DISTINCT w4.user_id)::numeric / NULLIF(COUNT(DISTINCT uc.user_id), 0) * 100), 
          1
        ) as week4_retention_percent,
        COUNT(DISTINCT cmr.user_id) as came_back_this_month,
        ROUND(
          (COUNT(DISTINCT cmr.user_id)::numeric / NULLIF(COUNT(DISTINCT uc.user_id), 0) * 100), 
          1
        ) as this_month_retention_percent,
        COALESCE(ROUND(ps.median_plays::numeric, 1), 0) as median_plays,
        COALESCE(ROUND(ps.avg_plays::numeric, 1), 0) as avg_plays
      FROM user_cohorts uc
      LEFT JOIN week1_returns w1 ON uc.joined_period = w1.joined_period AND uc.user_id = w1.user_id
      LEFT JOIN week4_returns w4 ON uc.joined_period = w4.joined_period AND uc.user_id = w4.user_id
      LEFT JOIN current_month_returns cmr ON uc.joined_period = cmr.joined_period AND uc.user_id = cmr.user_id
      LEFT JOIN play_stats ps ON uc.joined_period = ps.joined_period
      GROUP BY uc.joined_period, ps.median_plays, ps.avg_plays
      ORDER BY uc.joined_period DESC
    `;
    
    const result = await query(sql, [dateRange.from, dateRange.to]);
  
    // Count total user accounts 
    // Get active listeners count
    const totalUsersResult = await query(
      `SELECT COUNT(*) as active_listeners 
       FROM users
       WHERE role = 'USER'`,
      []
    );
    const totalUsers = totalUsersResult?.[0]?.active_listeners || 0;
    
    // Get new users count
    const newUsersResult = await query(
      `SELECT COUNT(*) as new_users FROM users WHERE created_at BETWEEN $1 AND $2 AND role = 'USER'`,
      [dateRange.from, dateRange.to]
    );
    const newUsers = newUsersResult?.[0]?.new_users || 0;
    
    // Get detailed user activity data
    const userDetailsResult = await query(
      `SELECT 
        u.username,
        u.created_at as joined_date,
        COUNT(sh.user_id) as total_listens,
        MAX(sh.played_at) as last_listened
      FROM users u
      LEFT JOIN song_history sh ON u.id = sh.user_id
      WHERE u.role = 'USER' AND u.created_at BETWEEN $1 AND $2
      GROUP BY u.id, u.username, u.created_at
      ORDER BY u.created_at DESC`,
      [dateRange.from, dateRange.to]
    );
    
    return {
      results: result || [],
      summary: {
        active_listeners: totalUsers,
        new_users: newUsers,
        total_cohorts: (result || []).length,
        user_details: userDetailsResult || []
      }
    };
  }
}

export default UserBehaviorReportsService;