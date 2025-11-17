import { query } from "../config/database.js";
import type { UUID } from "../types";

export interface DateRange {
  from: string;
  to: string;
}

export class SystemModerationReportsService {
  /**
   * Get simplified content moderation report
   * Returns summary stats, reported entries table, and trend data
   */
  static async getSimplifiedModerationReport(
    dateRange: DateRange,
    reportTypes?: string[],
    contentType: string = 'all',
    searchTerm?: string
  ) {
    // A. Get Summary Data
    const summary = await this.getSummaryData(dateRange, reportTypes, contentType, searchTerm);
    
    // B. Get Report Summary by Name (aggregated)
    const reportSummaryByName = await this.getReportSummaryByName(dateRange, reportTypes, contentType, searchTerm);
    
    // C. Get Report Details (individual reports)
    const reportDetails = await this.getReportDetails(dateRange, reportTypes, contentType, searchTerm);
    
    // D. Get Trends Data
    const trends = await this.getTrendsData(dateRange, reportTypes, contentType, searchTerm);
    
    return {
      summary,
      report_summary_by_name: reportSummaryByName,
      report_details: reportDetails,
      trends
    };
  }

  // Get summary statistics
  private static async getSummaryData(dateRange: DateRange, reportTypes?: string[], contentType: string = 'all', searchTerm?: string) {
    // Use join-based query when filtering by name
    if (searchTerm && searchTerm.trim()) {
      return await this.getSummaryDataWithSearch(dateRange, reportTypes, contentType, searchTerm);
    }
    
    let sql = `
      SELECT 
        COUNT(*) as total_reports,
        COUNT(DISTINCT r.reporter_id) as unique_reporters,
        COUNT(DISTINCT r.reported_id) as unique_items_reported
      FROM (
    `;
    
    const params = [dateRange.from, dateRange.to];
    let paramIndex = 3;
    
    // Build union query
    sql += this.buildUnionQuery(contentType);
    sql += `) r WHERE r.reported_at BETWEEN $1 AND $2`;
    
    // Filter by report types if given
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, index) => `$${paramIndex + index}`).join(', ');
      sql += ` AND r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
    }
    
    const result = await query(sql, params);
    const basicStats = result?.[0] || { total_reports: 0, unique_reporters: 0, unique_items_reported: 0 };
    
    // Get reports by type breakdown
    const reportsByType = await this.getReportsByTypeBreakdown(dateRange, reportTypes, contentType, searchTerm);
    
    // Get reports over time
    const reportsOverTime = await this.getReportsOverTime(dateRange, reportTypes, contentType, searchTerm);
    
    return {
      total_reports: parseInt(basicStats.total_reports),
      unique_reporters: parseInt(basicStats.unique_reporters),
      unique_items_reported: parseInt(basicStats.unique_items_reported),
      reports_by_type: reportsByType,
      reports_over_time: reportsOverTime
    };
  }

  // Summary with name search filter
  private static async getSummaryDataWithSearch(dateRange: DateRange, reportTypes: string[] | undefined, contentType: string, searchTerm: string) {
    const searchPattern = `%${searchTerm.trim()}%`;
    const params: any[] = [dateRange.from, dateRange.to];
    
    const { sql: unionSql, params: unionParams, newParamIndex } = this.buildUnionQueryWithSearch(contentType, searchPattern, 3);
    params.push(...unionParams);
    
    let sql = `
      SELECT 
        COUNT(*) as total_reports,
        COUNT(DISTINCT r.reporter_id) as unique_reporters,
        COUNT(DISTINCT r.reported_id) as unique_items_reported
      FROM (
        ${unionSql}
      ) r
    `;
    
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, idx) => `$${newParamIndex + idx}`).join(', ');
      sql += ` WHERE r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
    }
    
    const result = await query(sql, params);
    const basicStats = result?.[0] || { total_reports: 0, unique_reporters: 0, unique_items_reported: 0 };
    
    const reportsByType = await this.getReportsByTypeBreakdown(dateRange, reportTypes, contentType, searchTerm);
    const reportsOverTime = await this.getReportsOverTime(dateRange, reportTypes, contentType, searchTerm);
    
    return {
      total_reports: parseInt(basicStats.total_reports),
      unique_reporters: parseInt(basicStats.unique_reporters),
      unique_items_reported: parseInt(basicStats.unique_items_reported),
      reports_by_type: reportsByType,
      reports_over_time: reportsOverTime
    };
  }

  private static async getReportsByTypeBreakdown(dateRange: DateRange, reportTypes?: string[], contentType: string = 'all', searchTerm?: string) {
    // Use join-based query for name filtering
    if (searchTerm && searchTerm.trim()) {
      return await this.getReportsByTypeBreakdownWithSearch(dateRange, reportTypes, contentType, searchTerm);
    }
    
    // Main breakdown query
    let sql = `
      SELECT 
        r.report_type,
        COUNT(*) as count
      FROM (
    `;
    
    const params = [dateRange.from, dateRange.to];
    let paramIndex = 3;
    
    sql += this.buildUnionQuery(contentType);
    sql += `) r WHERE r.reported_at BETWEEN $1 AND $2`;
    
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, index) => `$${paramIndex + index}`).join(', ');
      sql += ` AND r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
    }
    
    sql += ` GROUP BY r.report_type ORDER BY count DESC`;
    
    const result = await query(sql, params);
    
    const breakdown: any = {};
    (result || []).forEach((row: any) => {
      breakdown[row.report_type] = parseInt(row.count);
    });
    
    return breakdown;
  }

  private static async getReportsByTypeBreakdownWithSearch(dateRange: DateRange, reportTypes: string[] | undefined, contentType: string, searchTerm: string) {
    const searchPattern = `%${searchTerm.trim()}%`;
    let unions: string[] = [];
    const params: any[] = [dateRange.from, dateRange.to];
    
    const { sql: unionSql, params: unionParams, newParamIndex } = this.buildUnionQueryWithSearch(contentType, searchPattern, 3);
    params.push(...unionParams);
    
    let sql = `
      SELECT 
        r.report_type,
        COUNT(*) as count
      FROM (
        ${unionSql}
      ) r
    `;
    
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, idx) => `$${newParamIndex + idx}`).join(', ');
      sql += ` WHERE r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
    }
    
    sql += ` GROUP BY r.report_type ORDER BY count DESC`;
    
    const result = await query(sql, params);
    
    const breakdown: any = {};
    (result || []).forEach((row: any) => {
      breakdown[row.report_type] = parseInt(row.count);
    });
    
    return breakdown;
  }

  private static async getReportsOverTime(dateRange: DateRange, reportTypes?: string[], contentType: string = 'all', searchTerm?: string) {
    // Use join-based query for name filtering
    if (searchTerm && searchTerm.trim()) {
      return await this.getReportsOverTimeWithSearch(dateRange, reportTypes, contentType, searchTerm);
    }
    
    let sql = `
      SELECT 
        DATE(r.reported_at) as date,
        COUNT(*) as count
      FROM (
    `;
    
    const params = [dateRange.from, dateRange.to];
    let paramIndex = 3;
    
    sql += this.buildUnionQuery(contentType);
    sql += `) r WHERE r.reported_at BETWEEN $1 AND $2`;
    
    // Filter by report types if given
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, index) => `$${paramIndex + index}`).join(', ');
      sql += ` AND r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
    }
    
    sql += ` GROUP BY DATE(r.reported_at) ORDER BY date ASC`;
    
    const result = await query(sql, params);
    
    return (result || []).map((row: any) => ({
      date: row.date,
      count: parseInt(row.count)
    }));
  }

  private static async getReportsOverTimeWithSearch(dateRange: DateRange, reportTypes: string[] | undefined, contentType: string, searchTerm: string) {
    const searchPattern = `%${searchTerm.trim()}%`;
    const params: any[] = [dateRange.from, dateRange.to];
    
    const { sql: unionSql, params: unionParams, newParamIndex } = this.buildUnionQueryWithSearch(contentType, searchPattern, 3);
    params.push(...unionParams);
    
    let sql = `
      SELECT 
        DATE(r.reported_at) as date,
        COUNT(*) as count
      FROM (
        ${unionSql}
      ) r
    `;
    
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, idx) => `$${newParamIndex + idx}`).join(', ');
      sql += ` WHERE r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
    }
    
    sql += ` GROUP BY DATE(r.reported_at) ORDER BY date ASC`;
    
    const result = await query(sql, params);
    
    return (result || []).map((row: any) => ({
      date: row.date,
      count: parseInt(row.count)
    }));
  }

  // Get reported content entries
  private static async getReportedEntries(dateRange: DateRange, reportTypes?: string[], contentType: string = 'all', searchTerm?: string) {
    const entries = [];
    
    if (contentType === 'all' || contentType === 'user') {
      const userReports = await this.getReportedEntriesForType('user', dateRange, reportTypes, searchTerm);
      entries.push(...userReports);
    }
    
    if (contentType === 'all' || contentType === 'song') {
      const songReports = await this.getReportedEntriesForType('song', dateRange, reportTypes, searchTerm);
      entries.push(...songReports);
    }
    
    if (contentType === 'all' || contentType === 'album') {
      const albumReports = await this.getReportedEntriesForType('album', dateRange, reportTypes, searchTerm);
      entries.push(...albumReports);
    }
    
    if (contentType === 'all' || contentType === 'playlist') {
      const playlistReports = await this.getReportedEntriesForType('playlist', dateRange, reportTypes, searchTerm);
      entries.push(...playlistReports);
    }
    
    // Sort newest first
    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return entries;
  }

  // Get Report Summary by Name (aggregated by entity)
  private static async getReportSummaryByName(dateRange: DateRange, reportTypes?: string[], contentType: string = 'all', searchTerm?: string) {
    const summaries = [];
    
    if (contentType === 'all' || contentType === 'user') {
      const userSummaries = await this.getReportSummaryForType('user', dateRange, reportTypes, searchTerm);
      summaries.push(...userSummaries);
    }
    
    if (contentType === 'all' || contentType === 'song') {
      const songSummaries = await this.getReportSummaryForType('song', dateRange, reportTypes, searchTerm);
      summaries.push(...songSummaries);
    }
    
    if (contentType === 'all' || contentType === 'album') {
      const albumSummaries = await this.getReportSummaryForType('album', dateRange, reportTypes, searchTerm);
      summaries.push(...albumSummaries);
    }
    
    if (contentType === 'all' || contentType === 'playlist') {
      const playlistSummaries = await this.getReportSummaryForType('playlist', dateRange, reportTypes, searchTerm);
      summaries.push(...playlistSummaries);
    }
    
    // Sort by total reports descending
    summaries.sort((a, b) => b.total_reports - a.total_reports);
    
    return summaries;
  }

  private static async getReportSummaryForType(
    itemType: 'user' | 'song' | 'album' | 'playlist',
    dateRange: DateRange,
    reportTypes?: string[],
    searchTerm?: string
  ) {
    let entityJoin = '';
    let entityName = '';
    
    switch (itemType) {
      case 'user':
        entityJoin = 'LEFT JOIN users e ON r.reported_id = e.id';
        entityName = 'e.username';
        break;
      case 'song':
        entityJoin = 'LEFT JOIN songs e ON r.reported_id = e.id';
        entityName = 'e.title';
        break;
      case 'album':
        entityJoin = 'LEFT JOIN albums e ON r.reported_id = e.id';
        entityName = 'e.title';
        break;
      case 'playlist':
        entityJoin = 'LEFT JOIN playlists e ON r.reported_id = e.id';
        entityName = 'e.title';
        break;
    }
    
    let sql = `
      SELECT 
        ${entityName} as name,
        '${itemType}' as content_type,
        COUNT(*) as total_reports,
        MAX(r.reported_at) as latest_reported_at
      FROM ${itemType}_reports r
      ${entityJoin}
      WHERE r.reported_at BETWEEN $1 AND $2
    `;
    
    const params = [dateRange.from, dateRange.to];
    let paramIndex = 3;
    
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, index) => `$${paramIndex + index}`).join(', ');
      sql += ` AND r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
      paramIndex += reportTypes.length;
    }
    
    if (searchTerm && searchTerm.trim()) {
      sql += ` AND ${entityName} ILIKE $${paramIndex}`;
      params.push(`%${searchTerm.trim()}%`);
    }
    
    sql += ` GROUP BY ${entityName} ORDER BY total_reports DESC`;
    
    const result = await query(sql, params);
    return result || [];
  }

  // Get Report Details (individual report rows)
  private static async getReportDetails(dateRange: DateRange, reportTypes?: string[], contentType: string = 'all', searchTerm?: string) {
    const details = [];
    
    if (contentType === 'all' || contentType === 'user') {
      const userDetails = await this.getReportDetailsForType('user', dateRange, reportTypes, searchTerm);
      details.push(...userDetails);
    }
    
    if (contentType === 'all' || contentType === 'song') {
      const songDetails = await this.getReportDetailsForType('song', dateRange, reportTypes, searchTerm);
      details.push(...songDetails);
    }
    
    if (contentType === 'all' || contentType === 'album') {
      const albumDetails = await this.getReportDetailsForType('album', dateRange, reportTypes, searchTerm);
      details.push(...albumDetails);
    }
    
    if (contentType === 'all' || contentType === 'playlist') {
      const playlistDetails = await this.getReportDetailsForType('playlist', dateRange, reportTypes, searchTerm);
      details.push(...playlistDetails);
    }
    
    // Sort newest first
    details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return details;
  }

  private static async getReportDetailsForType(
    itemType: 'user' | 'song' | 'album' | 'playlist',
    dateRange: DateRange,
    reportTypes?: string[],
    searchTerm?: string
  ) {
    let entityJoin = '';
    let entityName = '';
    
    switch (itemType) {
      case 'user':
        entityJoin = 'LEFT JOIN users e ON r.reported_id = e.id';
        entityName = 'e.username';
        break;
      case 'song':
        entityJoin = 'LEFT JOIN songs e ON r.reported_id = e.id';
        entityName = 'e.title';
        break;
      case 'album':
        entityJoin = 'LEFT JOIN albums e ON r.reported_id = e.id';
        entityName = 'e.title';
        break;
      case 'playlist':
        entityJoin = 'LEFT JOIN playlists e ON r.reported_id = e.id';
        entityName = 'e.title';
        break;
    }
    
    let sql = `
      SELECT 
        r.reported_at as date,
        ${entityName} as name,
        r.report_type,
        CASE 
          WHEN r.report_status = 'PENDING_REVIEW' THEN 'pending'
          WHEN r.report_status = 'ACTION_TAKEN' THEN 'resolved'
          WHEN r.report_status = 'DISMISSED' THEN 'dismissed'
          ELSE 'pending'
        END as status
      FROM ${itemType}_reports r
      ${entityJoin}
      WHERE r.reported_at BETWEEN $1 AND $2
    `;
    
    const params = [dateRange.from, dateRange.to];
    let paramIndex = 3;
    
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, index) => `$${paramIndex + index}`).join(', ');
      sql += ` AND r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
      paramIndex += reportTypes.length;
    }
    
    if (searchTerm && searchTerm.trim()) {
      sql += ` AND ${entityName} ILIKE $${paramIndex}`;
      params.push(`%${searchTerm.trim()}%`);
    }
    
    sql += ` ORDER BY r.reported_at DESC LIMIT 500`;
    
    const result = await query(sql, params);
    return result || [];
  }

  private static async getReportedEntriesForType(
    itemType: 'user' | 'song' | 'album' | 'playlist',
    dateRange: DateRange,
    reportTypes?: string[],
    searchTerm?: string
  ) {
    let entityJoin = '';
    let entityName = '';
    
    switch (itemType) {
      case 'user':
        entityJoin = 'LEFT JOIN users e ON r.reported_id = e.id';
        entityName = 'e.username';
        break;
      case 'song':
        entityJoin = 'LEFT JOIN songs e ON r.reported_id = e.id';
        entityName = 'e.title';
        break;
      case 'album':
        entityJoin = 'LEFT JOIN albums e ON r.reported_id = e.id';
        entityName = 'e.title';
        break;
      case 'playlist':
        entityJoin = 'LEFT JOIN playlists e ON r.reported_id = e.id';
        entityName = 'e.title';
        break;
    }
    
    let sql = `
      SELECT 
        r.report_type,
        '${itemType}' as item_type,
        ${entityName} as item_name,
        r.reported_id as item_id,
        COUNT(*) OVER (PARTITION BY r.reported_id) as report_count,
        CASE 
          WHEN r.report_status = 'PENDING_REVIEW' THEN 'pending'
          WHEN r.report_status = 'ACTION_TAKEN' THEN 'resolved'
          WHEN r.report_status = 'DISMISSED' THEN 'dismissed'
          ELSE 'pending'
        END as status,
        r.reported_at as created_at,
        CASE 
          WHEN r.report_status = 'ACTION_TAKEN' AND '${itemType}' = 'user' THEN 'suspended'
          WHEN r.report_status = 'ACTION_TAKEN' THEN 'hidden'
          WHEN r.report_status = 'DISMISSED' THEN 'dismissed'
          ELSE NULL
        END as action
      FROM ${itemType}_reports r
      ${entityJoin}
      WHERE r.reported_at BETWEEN $1 AND $2
    `;
    
    const params = [dateRange.from, dateRange.to];
    let paramIndex = 3;
    
    if (reportTypes && reportTypes.length > 0) {
      const placeholders = reportTypes.map((_, index) => `$${paramIndex + index}`).join(', ');
      sql += ` AND r.report_type IN (${placeholders})`;
      params.push(...reportTypes);
      paramIndex += reportTypes.length;
    }
    
    // Filter by name if search provided
    if (searchTerm && searchTerm.trim()) {
      sql += ` AND ${entityName} ILIKE $${paramIndex}`;
      params.push(`%${searchTerm.trim()}%`);
    }
    
    sql += ` ORDER BY r.reported_at DESC LIMIT 100`;
    
    const result = await query(sql, params);
    return result || [];
  }

  // Get trend analysis
  private static async getTrendsData(dateRange: DateRange, reportTypes?: string[], contentType: string = 'all', searchTerm?: string) {
    const reportVolumeTrend = await this.getReportsOverTime(dateRange, reportTypes, contentType, searchTerm);
    const topReportTypes = await this.getReportsByTypeBreakdown(dateRange, reportTypes, contentType, searchTerm);
    
    return {
      report_volume_trend: reportVolumeTrend,
      top_report_types: Object.entries(topReportTypes)
        .map(([type, count]) => ({ type, count }))
        .sort((a: any, b: any) => b.count - a.count)
    };
  }

  // Build union query for content types
  private static buildUnionQuery(contentType: string): string {
    if (contentType === 'all') {
      return `
        SELECT report_type, report_status, reported_at, reporter_id, reported_id FROM user_reports
        UNION ALL
        SELECT report_type, report_status, reported_at, reporter_id, reported_id FROM song_reports
        UNION ALL
        SELECT report_type, report_status, reported_at, reporter_id, reported_id FROM album_reports
        UNION ALL
        SELECT report_type, report_status, reported_at, reporter_id, reported_id FROM playlist_reports
      `;
    } else {
      return `
        SELECT report_type, report_status, reported_at, reporter_id, reported_id FROM ${contentType}_reports
      `;
    }
  }

  // Build union query with joins for name search
  private static buildUnionQueryWithSearch(contentType: string, searchPattern: string, baseParamIndex: number): { sql: string, params: string[], newParamIndex: number } {
    const unions: string[] = [];
    const params: string[] = [];
    let paramIndex = baseParamIndex;

    const contentTypes = contentType === 'all' 
      ? [{ type: 'user', table: 'users', nameCol: 'username' },
         { type: 'song', table: 'songs', nameCol: 'title' },
         { type: 'album', table: 'albums', nameCol: 'title' },
         { type: 'playlist', table: 'playlists', nameCol: 'title' }]
      : [{ type: contentType, 
           table: contentType === 'user' ? 'users' : `${contentType}s`, 
           nameCol: contentType === 'user' ? 'username' : 'title' }];

    contentTypes.forEach(({ type, table, nameCol }) => {
      unions.push(`
        SELECT r.report_type, r.reporter_id, r.reported_id, r.reported_at
        FROM ${type}_reports r
        LEFT JOIN ${table} e ON r.reported_id = e.id
        WHERE r.reported_at BETWEEN $1 AND $2 AND e.${nameCol} ILIKE $${paramIndex}
      `);
      params.push(searchPattern);
      paramIndex++;
    });

    return { sql: unions.join(' UNION ALL '), params, newParamIndex: paramIndex };
  }

}

export default SystemModerationReportsService;