import type { UUID, WeeklyPlays } from "@types";
import { query } from "@config/database.js";

/**
 * Service for retrieving statistics for entities
 */
export default class StatsService {
  /**
   * Get weekly play counts for a song
   * @param songId The ID of the song
   * @returns Weekly plays data
   */
  static async getWeeklyPlays(songId: UUID): Promise<WeeklyPlays> {
    try {
      const result = await query(
        `WITH weekly_plays AS (
          SELECT 
            DATE_TRUNC('week', played_at) AS week_start,
            COUNT(*) AS play_count
          FROM song_history
          WHERE song_id = $1
          GROUP BY DATE_TRUNC('week', played_at)
          ORDER BY week_start
        )
        SELECT 
          json_build_object(
            'plays', json_agg(play_count ORDER BY week_start),
            'weeks', json_agg(TO_CHAR(week_start, 'YYYY-MM-DD') ORDER BY week_start)
          ) AS result
        FROM weekly_plays`,
        [songId]
      );
      if (result.length === 0 || !result[0].result) {
        return { weeks: [], plays: [] };
      }
      return result[0].result;
    } catch (error) {
      console.error("Error retrieving weekly plays:", error);
      throw error;
    }
  }
}
