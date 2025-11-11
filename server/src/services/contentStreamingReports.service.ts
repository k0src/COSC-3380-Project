import { query } from "../config/database.js";
import type { UUID } from "../types";

export interface DateRange {
  from: string;
  to: string;
}

export class ContentStreamingReportsService {
  /**
   * Top streamed songs/albums/artists
   * Parameters:
   * - contentType: 'songs' | 'albums' | 'artists'
   * - limit: number of top items to return
   * - genre: optional genre filter
   * - includeMetrics: whether to include detailed engagement metrics
   * - sortBy: 'streams' | 'alphabetical' | 'genre'
   */
  static async getTopContent(
    dateRange: DateRange,
    contentType: 'songs' | 'albums' | 'artists' = 'songs',
    limit: number = 50,
    genre?: string,
    includeMetrics: boolean = false,
    sortBy: 'streams' | 'alphabetical' | 'genre' = 'streams'
  ) {
    // First, get the main content data
    const results = await this.getContentData(dateRange, contentType, limit, genre, sortBy);
    
    // Get comparative context
    const summary = await this.getComparativeContext(dateRange, contentType, genre);
    
    return {
      results,
      summary
    };
  }

  /**
   * Helper method to get the main content data
   */
  private static async getContentData(
    dateRange: DateRange,
    contentType: 'songs' | 'albums' | 'artists',
    limit: number,
    genre?: string,
    sortBy: 'streams' | 'alphabetical' | 'genre' = 'streams'
  ) {
    let sql = '';
    const params = [dateRange.from, dateRange.to];
    let paramIndex = 3;
    
    switch (contentType) {
      case 'songs':
        sql = `
          SELECT 
            s.title as song_name,
            s.genre,
            STRING_AGG(DISTINCT a.display_name, ', ' ORDER BY a.display_name) as artist_name,
            al.title as album_title,
            COUNT(h.song_id) as stream_count,
            COUNT(DISTINCT h.user_id) as unique_listeners,
            ROUND(COUNT(h.song_id)::numeric / NULLIF(COUNT(DISTINCT h.user_id), 0), 2) as avg_streams_per_listener
          FROM songs s
          JOIN song_artists sa ON s.id = sa.song_id
          JOIN artists a ON sa.artist_id = a.id
          LEFT JOIN album_songs als ON s.id = als.song_id
          LEFT JOIN albums al ON als.album_id = al.id
          JOIN song_history h ON s.id = h.song_id
          WHERE h.played_at BETWEEN $1 AND $2

        `;
        break;
        
      case 'albums':
        sql = `
          SELECT 
            al.title as album_name,
            a.display_name as artist_name,
            al.release_date,
            COUNT(*) as stream_count,
            COUNT(DISTINCT s.id) as songs_in_album,
            COUNT(DISTINCT h.user_id) as unique_listeners,
            ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT h.user_id), 0), 2) as avg_streams_per_listener
          FROM albums al
          JOIN artists a ON al.created_by = a.id
          JOIN album_songs als ON al.id = als.album_id
          JOIN songs s ON als.song_id = s.id
          JOIN song_history h ON s.id = h.song_id
          WHERE h.played_at BETWEEN $1 AND $2
        `;
        break;
        
      case 'artists':
        sql = `
          SELECT 
            a.display_name as artist_name,
            COUNT(*) as stream_count,
            COUNT(DISTINCT als.album_id) as albums_streamed,
            COUNT(DISTINCT h.user_id) as unique_listeners,
            ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT h.user_id), 0), 2) as avg_streams_per_listener
          FROM artists a
          JOIN song_artists sa ON a.id = sa.artist_id
          JOIN songs s ON sa.song_id = s.id
          LEFT JOIN album_songs als ON s.id = als.song_id
          JOIN song_history h ON s.id = h.song_id
          WHERE h.played_at BETWEEN $1 AND $2
        `;
        break;
    }
    
    // Add genre filter if specified
    if (genre) {
      if (contentType === 'songs') {
        sql += ` AND s.genre = $${paramIndex}`;
      } else if (contentType === 'albums') {
        sql += ` AND s.genre = $${paramIndex}`;
      } else {
        // For artists, filter by the genre of their songs
        sql += ` AND s.genre = $${paramIndex}`;
      }
      params.push(genre);
      paramIndex++;
    }
    
    // Add GROUP BY clause
    switch (contentType) {
      case 'songs':
        sql += ` GROUP BY s.id, s.title, s.genre, al.title`;
        break;
      case 'albums':
        sql += ` GROUP BY al.id, al.title, a.display_name, al.release_date`;
        break;
      case 'artists':
        sql += ` GROUP BY a.id, a.display_name`;
        break;
    }
    
    // Add ORDER BY clause based on sortBy parameter
    switch (sortBy) {
      case 'streams':
        sql += ` ORDER BY stream_count DESC`;
        break;
      case 'alphabetical':
        // Sort alphabetically by the main content name
        if (contentType === 'songs') {
          sql += ` ORDER BY s.title ASC`;
        } else if (contentType === 'albums') {
          sql += ` ORDER BY al.title ASC`;
        } else {
          sql += ` ORDER BY a.display_name ASC`;
        }
        break;
      case 'genre':
        // Sort by genre (only applicable for songs, fallback to streams for others)
        if (contentType === 'songs') {
          sql += ` ORDER BY s.genre ASC, stream_count DESC`;
        } else {
          sql += ` ORDER BY stream_count DESC`;
        }
        break;
    }
    
    sql += ` LIMIT $${paramIndex}`;
    params.push(limit.toString());
    
    const result = await query(sql, params);
    
    // Calculate percentage of total platform streams for each item
    const totalStreams = await this.getTotalPlatformStreams(dateRange);
    
    return (result || []).map((row: any) => ({
      ...row,
      percentage_of_total_streams: totalStreams > 0 
        ? parseFloat(((row.stream_count / totalStreams) * 100).toFixed(2))
        : 0
    }));
  }

  /**
   * Get total platform streams for the period
   */
  private static async getTotalPlatformStreams(dateRange: DateRange): Promise<number> {
    const sql = `
      SELECT COUNT(*) as total_streams
      FROM song_history
      WHERE played_at BETWEEN $1 AND $2
    `;
    
    const result = await query(sql, [dateRange.from, dateRange.to]);
    return result?.[0]?.total_streams || 0;
  }

  /**
   * Get comparative context including genre performance
   */
  private static async getComparativeContext(
    dateRange: DateRange,
    contentType: 'songs' | 'albums' | 'artists',
    genre?: string
  ) {
    // Get total platform streams
    const totalStreams = await this.getTotalPlatformStreams(dateRange);
    
    // Get unique listener count for the entire period
    const uniqueListeners = await this.getUniqueListeners(dateRange);
    
    // Calculate platform-wide average streams per listener
    const avgStreamsPerListener = uniqueListeners > 0 
      ? parseFloat((totalStreams / uniqueListeners).toFixed(2))
      : 0;
    
    return {
      total_platform_streams: totalStreams,
      unique_listeners: uniqueListeners,
      avg_streams_per_listener: avgStreamsPerListener,
      filtered_by_genre: genre || null
    };
  }

  /**
   * Get unique listener count for the period
   */
  private static async getUniqueListeners(dateRange: DateRange): Promise<number> {
    const sql = `
      SELECT COUNT(DISTINCT user_id) as unique_listeners
      FROM song_history
      WHERE played_at BETWEEN $1 AND $2
    `;
    
    const result = await query(sql, [dateRange.from, dateRange.to]);
    return result?.[0]?.unique_listeners || 0;
  }
}

export default ContentStreamingReportsService;