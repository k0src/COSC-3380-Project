import { query } from "../config/database.js";
import type { UUID } from "../types";

export interface DateRange {
  from: string;
  to: string;
}

export class ContentStreamingReportsService {
  /**
   * Get top streamed content with optional filters
   */
  static async getTopContent(
    dateRange: DateRange,
    contentType: 'songs' | 'albums' | 'artists' = 'songs',
    limit: number = 50,
    genre?: string,
    includeMetrics: boolean = false,
    sortBy: 'streams' | 'alphabetical' | 'genre' = 'streams'
  ) {
    // Validate genre if provided
    if (genre && (contentType === 'songs' || contentType === 'albums')) {
      const genreExists = await this.checkGenreExists(genre, contentType);
      if (!genreExists) {
        throw new Error(`The genre "${genre}" was not found in our ${contentType} catalog. Please try a different genre.`);
      }
    }
    
    const results = await this.getContentData(dateRange, contentType, limit, genre, sortBy);
    const summary = await this.getComparativeContext(dateRange, contentType, genre);
    
    return {
      results,
      summary
    };
  }

  /**
   * Check if a genre exists in the database for songs or albums
   */
  private static async checkGenreExists(genre: string, contentType: 'songs' | 'albums'): Promise<boolean> {
    let sql = '';
    
    if (contentType === 'songs') {
      sql = `
        SELECT EXISTS(
          SELECT 1 FROM songs WHERE genre = $1
        ) as exists
      `;
    } else if (contentType === 'albums') {
      sql = `
        SELECT EXISTS(
          SELECT 1 
          FROM albums al
          JOIN album_songs als ON al.id = als.album_id
          JOIN songs s ON als.song_id = s.id
          WHERE s.genre = $1
        ) as exists
      `;
    }
    
    const result = await query(sql, [genre]);
    return result?.[0]?.exists || false;
  }

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
    
    // Filter by genre if provided
    if (genre) {
      if (contentType === 'songs') {
        sql += ` AND s.genre = $${paramIndex}`;
      } else if (contentType === 'albums') {
        sql += ` AND s.genre = $${paramIndex}`;
      } else {
        sql += ` AND s.genre = $${paramIndex}`;
      }
      params.push(genre);
      paramIndex++;
    }
    
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
    const totalStreams = await this.getTotalPlatformStreams(dateRange);
    
    return (result || []).map((row: any) => ({
      ...row,
      percentage_of_total_streams: totalStreams > 0 
        ? parseFloat(((row.stream_count / totalStreams) * 100).toFixed(2))
        : 0
    }));
  }

  //Get total platform streams for the period

  private static async getTotalPlatformStreams(dateRange: DateRange): Promise<number> {
    const sql = `
      SELECT COUNT(*) as total_streams
      FROM song_history
      WHERE played_at BETWEEN $1 AND $2
    `;
    
    const result = await query(sql, [dateRange.from, dateRange.to]);
    return result?.[0]?.total_streams || 0;
  }

  private static async getComparativeContext(
    dateRange: DateRange,
    contentType: 'songs' | 'albums' | 'artists',
    genre?: string
  ) {
    const totalStreams = await this.getTotalPlatformStreams(dateRange);
    const uniqueListeners = await this.getUniqueListeners(dateRange);
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