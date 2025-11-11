import { query } from "../config/database.js";
import type { UUID } from "../types";

export interface DateRange {
  from: string;
  to: string;
}

export class SystemModerationReportsService {
  /**
   * Number of reports by type 
   * Parameters:
   * - reportTypes: array of specific report types to include (e.g., ['explicit', 'hateful', 'spam'])
   * - contentType: specific content type to focus on ('user', 'song', 'album', 'playlist', or 'all')
   * - includeRiskAnalysis: whether to include risk level categorization
   * - groupBy: 'type' | 'date' | 'status' 
   */
  static async getReportsByType(
    dateRange: DateRange, 
    reportTypes?: string[],
    contentType: string = 'all',
    includeRiskAnalysis: boolean = false,
    groupBy: 'type' | 'date' | 'status' = 'type'
  ) {
    // Step 1: Get current period data
    const currentPeriodData = await this.getCurrentPeriodReports(dateRange, reportTypes, contentType);
    
    // Step 2: Get previous period data for trends
    const previousPeriodData = await this.getPreviousPeriodReports(dateRange, reportTypes, contentType);
    
    // Step 3: Get resolution metrics (pending vs resolved)
    const resolutionMetrics = await this.getResolutionMetrics(dateRange, reportTypes, contentType);
    
    // Step 4: Get repeat offenders
    const repeatOffenders = await this.getRepeatOffenders(dateRange, contentType);
    
    // Step 5: Calculate totals for percentages
    const totalReports = currentPeriodData.reduce((sum: number, row: any) => sum + parseInt(row.total_reports), 0);
    
    // Step 6: Combine all data
    const enrichedData = currentPeriodData.map((current: any) => {
      const previous = previousPeriodData.find((p: any) => p.report_type === current.report_type);
      
      return {
        ...current,
        // Percentage of total
        percentage_of_total: totalReports > 0 
          ? parseFloat(((parseInt(current.total_reports) / totalReports) * 100).toFixed(1))
          : 0,
        
        // Trend indicators
        previous_period_reports: previous?.total_reports || 0,
        report_change_percent: previous?.total_reports > 0
          ? parseFloat((((current.total_reports - previous.total_reports) / previous.total_reports) * 100).toFixed(1))
          : null,
        trend: previous?.total_reports 
          ? (current.total_reports > previous.total_reports ? 'increasing' : 
             current.total_reports < previous.total_reports ? 'decreasing' : 'stable')
          : 'new'
      };
    });
    
    return {
      results: enrichedData,
      summary: {
        total_reports: totalReports,
        pending_reports: resolutionMetrics.pending_count,
        resolved_reports: resolutionMetrics.resolved_count,
        pending_vs_resolved_ratio: resolutionMetrics.resolved_count > 0
          ? parseFloat((resolutionMetrics.pending_count / resolutionMetrics.resolved_count).toFixed(2))
          : null,
        unique_items_reported: resolutionMetrics.unique_items,
        repeat_offenders_count: repeatOffenders.length,
        repeat_offenders: repeatOffenders
      }
    };
  }
  
  // Helper method: Get current period reports
  private static async getCurrentPeriodReports(dateRange: DateRange, reportTypes?: string[], contentType: string = 'all') {
    let sql = `
      SELECT 
        r.report_type,
        COUNT(*) as total_reports,
        COUNT(DISTINCT r.reported_id) as unique_items_reported,
        COUNT(CASE WHEN r.report_status = 'ACTION_TAKEN' THEN 1 END) as actions_taken,
        CAST(
          (COUNT(CASE WHEN r.report_status = 'ACTION_TAKEN' THEN 1 END)::float / NULLIF(COUNT(*), 0)) * 100 AS DECIMAL(5,1)
        ) as action_rate_percent
      FROM (
    `;
    
    const params = [dateRange.from, dateRange.to];
    let paramIndex = 3;
    
    // Build the UNION query based on content type
    if (contentType === 'all') {
      sql += `
        SELECT report_type, report_status, reported_at, reporter_id, reported_id FROM user_reports
        WHERE reported_at BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT report_type, report_status, reported_at, reporter_id, reported_id FROM song_reports
        WHERE reported_at BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT report_type, report_status, reported_at, reporter_id, reported_id FROM album_reports
        WHERE reported_at BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT report_type, report_status, reported_at, reporter_id, reported_id FROM playlist_reports
        WHERE reported_at BETWEEN $1 AND $2
      `;
    } else {
      sql += `
        SELECT report_type, report_status, reported_at, reporter_id, reported_id FROM ${contentType}_reports
        WHERE reported_at BETWEEN $1 AND $2
      `;
    }
    
    sql += `) r WHERE 1=1`;
    
    // Filter by specific report types if provided
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, index) => `$${paramIndex + index}`).join(', ');
      sql += ` AND r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
    }
    
    sql += ` 
      GROUP BY r.report_type 
      ORDER BY total_reports DESC
    `;
    
    const result = await query(sql, params);
    return result || [];
  }
  
  // Helper method: Get previous period reports for trend comparison
  private static async getPreviousPeriodReports(dateRange: DateRange, reportTypes?: string[], contentType: string = 'all') {
    // Calculate previous period range
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    const periodLength = toDate.getTime() - fromDate.getTime();
    
    const previousFrom = new Date(fromDate.getTime() - periodLength).toISOString().split('T')[0];
    const previousTo = new Date(fromDate.getTime() - 86400000).toISOString().split('T')[0];
    
    let sql = `
      SELECT 
        r.report_type,
        COUNT(*) as total_reports
      FROM (
    `;
    
    const params = [previousFrom, previousTo];
    let paramIndex = 3;
    
    // Build the UNION query based on content type
    if (contentType === 'all') {
      sql += `
        SELECT report_type, report_status, reported_at FROM user_reports
        WHERE reported_at BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT report_type, report_status, reported_at FROM song_reports
        WHERE reported_at BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT report_type, report_status, reported_at FROM album_reports
        WHERE reported_at BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT report_type, report_status, reported_at FROM playlist_reports
        WHERE reported_at BETWEEN $1 AND $2
      `;
    } else {
      sql += `
        SELECT report_type, report_status, reported_at FROM ${contentType}_reports
        WHERE reported_at BETWEEN $1 AND $2
      `;
    }
    
    sql += `) r WHERE 1=1`;
    
    // Filter by specific report types if provided
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, index) => `$${paramIndex + index}`).join(', ');
      sql += ` AND r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
    }
    
    sql += ` 
      GROUP BY r.report_type
    `;
    
    const result = await query(sql, params);
    return result || [];
  }
  
  // Helper method: Get resolution metrics (pending vs resolved)
  private static async getResolutionMetrics(dateRange: DateRange, reportTypes?: string[], contentType: string = 'all') {
    let sql = `
      SELECT 
        COUNT(CASE WHEN r.report_status = 'PENDING_REVIEW' THEN 1 END) as pending_count,
        COUNT(CASE WHEN r.report_status IN ('ACTION_TAKEN', 'DISMISSED') THEN 1 END) as resolved_count,
        COUNT(DISTINCT r.reported_id) as unique_items
      FROM (
    `;
    
    const params = [dateRange.from, dateRange.to];
    let paramIndex = 3;
    
    // Build the UNION query based on content type
    if (contentType === 'all') {
      sql += `
        SELECT report_type, report_status, reported_id FROM user_reports
        WHERE reported_at BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT report_type, report_status, reported_id FROM song_reports
        WHERE reported_at BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT report_type, report_status, reported_id FROM album_reports
        WHERE reported_at BETWEEN $1 AND $2
        
        UNION ALL
        
        SELECT report_type, report_status, reported_id FROM playlist_reports
        WHERE reported_at BETWEEN $1 AND $2
      `;
    } else {
      sql += `
        SELECT report_type, report_status, reported_id FROM ${contentType}_reports
        WHERE reported_at BETWEEN $1 AND $2
      `;
    }
    
    sql += `) r WHERE 1=1`;
    
    // Filter by specific report types if provided
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, index) => `$${paramIndex + index}`).join(', ');
      sql += ` AND r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
    }
    
    const result = await query(sql, params);
    return result?.[0] || { pending_count: 0, resolved_count: 0, unique_items: 0 };
  }
  
  // Helper method: Get repeat offenders (items/users with multiple reports)
  private static async getRepeatOffenders(dateRange: DateRange, contentType: string = 'all') {
    let sql = '';
    const params = [dateRange.from, dateRange.to];
    
    if (contentType === 'all' || contentType === 'user') {
      sql = `
        SELECT 
          'user' as entity_type,
          r.reported_id,
          u.username as entity_name,
          COUNT(*) as report_count
        FROM user_reports r
        LEFT JOIN users u ON r.reported_id = u.id
        WHERE r.reported_at BETWEEN $1 AND $2
        GROUP BY r.reported_id, u.username
        HAVING COUNT(*) >= 2
        ORDER BY report_count DESC
        LIMIT 10
      `;
    } else if (contentType === 'song') {
      sql = `
        SELECT 
          'song' as entity_type,
          r.reported_id,
          s.title as entity_name,
          COUNT(*) as report_count
        FROM song_reports r
        LEFT JOIN songs s ON r.reported_id = s.id
        WHERE r.reported_at BETWEEN $1 AND $2
        GROUP BY r.reported_id, s.title
        HAVING COUNT(*) >= 2
        ORDER BY report_count DESC
        LIMIT 10
      `;
    } else if (contentType === 'album') {
      sql = `
        SELECT 
          'album' as entity_type,
          r.reported_id,
          a.title as entity_name,
          COUNT(*) as report_count
        FROM album_reports r
        LEFT JOIN albums a ON r.reported_id = a.id
        WHERE r.reported_at BETWEEN $1 AND $2
        GROUP BY r.reported_id, a.title
        HAVING COUNT(*) >= 2
        ORDER BY report_count DESC
        LIMIT 10
      `;
    } else if (contentType === 'playlist') {
      sql = `
        SELECT 
          'playlist' as entity_type,
          r.reported_id,
          p.title as entity_name,
          COUNT(*) as report_count
        FROM playlist_reports r
        LEFT JOIN playlists p ON r.reported_id = p.id
        WHERE r.reported_at BETWEEN $1 AND $2
        GROUP BY r.reported_id, p.title
        HAVING COUNT(*) >= 2
        ORDER BY report_count DESC
        LIMIT 10
      `;
    }
    
    if (!sql) return [];
    
    const result = await query(sql, params);
    return result || [];
  }
}

export default SystemModerationReportsService;