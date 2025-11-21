import type { UUID, WeeklyPlays, Song } from "@types";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

interface ArtistQuickStats {
  listeners: number;
  streams: number;
  newFollowers: number;
  playlistAdds: number;
}

/**
 * Service for retrieving statistics for entities
 */
export default class StatsService {
  /**
   * Get quick stats for an artist
   */
  static async getArtistQuickStats(
    artistId: UUID,
    days: number = 30
  ): Promise<ArtistQuickStats> {
    try {
      const result = await query(
        `WITH listeners AS (
          SELECT COUNT(DISTINCT sh.user_id) AS count
          FROM song_history sh
          JOIN song_artists sa ON sh.song_id = sa.song_id
          WHERE sa.artist_id = $1
            AND sh.played_at >= NOW() - INTERVAL '1 day' * $2
        ),
        streams AS (
          SELECT COUNT(*) AS count
          FROM song_history sh
          JOIN song_artists sa ON sh.song_id = sa.song_id
          WHERE sa.artist_id = $1
            AND sh.played_at >= NOW() - INTERVAL '1 day' * $2
        ),
        new_followers AS (
          SELECT COUNT(*) AS count
          FROM user_followers uf
          JOIN users u ON uf.following_id = u.id
          WHERE u.artist_id = $1
            AND uf.followed_at >= NOW() - INTERVAL '1 day' * $2
        ),
        playlist_adds AS (
          SELECT COUNT(*) AS count
          FROM playlist_songs ps
          JOIN song_artists sa ON ps.song_id = sa.song_id
          WHERE sa.artist_id = $1
            AND ps.added_at >= NOW() - INTERVAL '1 day' * $2
        )
        SELECT 
          (SELECT count FROM listeners) AS listeners,
          (SELECT count FROM streams) AS streams,
          (SELECT count FROM new_followers) AS new_followers,
          (SELECT count FROM playlist_adds) AS playlist_adds`,
        [artistId, days]
      );

      if (result.length === 0) {
        return {
          listeners: 0,
          streams: 0,
          newFollowers: 0,
          playlistAdds: 0,
        };
      }

      return {
        listeners: parseInt(result[0].listeners) || 0,
        streams: parseInt(result[0].streams) || 0,
        newFollowers: parseInt(result[0].new_followers) || 0,
        playlistAdds: parseInt(result[0].playlist_adds) || 0,
      };
    } catch (error) {
      console.error("Error retrieving artist quick stats:", error);
      throw error;
    }
  }

  /**
   * Get top performing song for an artist
   */
  static async getArtistTopSong(
    artistId: UUID,
    days: number = 30
  ): Promise<Song | null> {
    try {
      const result = await query(
        `WITH song_plays AS (
          SELECT 
            s.id,
            COUNT(sh.song_id) AS recent_plays
          FROM songs s
          JOIN song_artists sa ON s.id = sa.song_id
          LEFT JOIN song_history sh ON s.id = sh.song_id 
            AND sh.played_at >= NOW() - INTERVAL '1 day' * $2
          WHERE sa.artist_id = $1
          GROUP BY s.id
        )
        SELECT 
          s.*,
          COALESCE(COUNT(DISTINCT sl.user_id), 0) AS likes,
          COALESCE(COUNT(DISTINCT c.id), 0) AS comments
        FROM songs s
        JOIN song_plays sp ON s.id = sp.id
        LEFT JOIN song_likes sl ON s.id = sl.song_id
        LEFT JOIN comments c ON s.id = c.song_id
        GROUP BY s.id, sp.recent_plays
        ORDER BY sp.recent_plays DESC, s.streams DESC
        LIMIT 1`,
        [artistId, days]
      );

      if (result.length === 0) {
        return null;
      }

      const song = result[0] as Song;

      if (song.image_url) {
        song.image_url = getBlobUrl(song.image_url);
      }
      if (song.audio_url) {
        song.audio_url = getBlobUrl(song.audio_url);
      }
      song.type = "song";

      return song;
    } catch (error) {
      console.error("Error retrieving artist top song:", error);
      throw error;
    }
  }

  /**
   * Get daily streams for an artist over a time range
   */
  static async getArtistDailyStreams(
    artistId: UUID,
    days: number = 30
  ): Promise<number[]> {
    try {
      const result = await query(
        `WITH date_series AS (
          SELECT generate_series(
            CURRENT_DATE - $2::integer,
            CURRENT_DATE - 1,
            '1 day'::interval
          )::date AS day
        ),
        daily_streams AS (
          SELECT 
            DATE(sh.played_at) AS day,
            COUNT(*) AS streams
          FROM song_history sh
          JOIN song_artists sa ON sh.song_id = sa.song_id
          WHERE sa.artist_id = $1
            AND sh.played_at >= CURRENT_DATE - $2::integer
            AND sh.played_at < CURRENT_DATE
          GROUP BY DATE(sh.played_at)
        )
        SELECT 
          COALESCE(ds.streams, 0) AS streams
        FROM date_series d
        LEFT JOIN daily_streams ds ON d.day = ds.day
        ORDER BY d.day ASC`,
        [artistId, days]
      );

      return result.map((row) => parseInt(row.streams) || 0);
    } catch (error) {
      console.error("Error retrieving artist daily streams:", error);
      throw error;
    }
  }

  /**
   * Get top performing songs for an artist
   */
  static async getArtistTopSongs(
    artistId: UUID,
    days: number = 30,
    limit: number = 5
  ): Promise<Song[]> {
    try {
      const result = await query(
        `WITH song_plays AS (
          SELECT 
            s.id,
            COUNT(sh.song_id) AS recent_plays
          FROM songs s
          JOIN song_artists sa ON s.id = sa.song_id
          LEFT JOIN song_history sh ON s.id = sh.song_id 
            AND sh.played_at >= NOW() - INTERVAL '1 day' * $2
          WHERE sa.artist_id = $1
          GROUP BY s.id
        )
        SELECT 
          s.*
        FROM songs s
        JOIN song_plays sp ON s.id = sp.id
        WHERE sp.recent_plays > 0
        ORDER BY sp.recent_plays DESC, s.streams DESC
        LIMIT $3`,
        [artistId, days, limit]
      );

      return result.map((song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }
        song.type = "song";
        return song as Song;
      });
    } catch (error) {
      console.error("Error retrieving artist top songs:", error);
      throw error;
    }
  }

  /**
   * Get top playlists containing an artist's songs
   */
  static async getArtistTopPlaylists(
    artistId: UUID,
    days: number = 30,
    limit: number = 5
  ): Promise<any[]> {
    try {
      const result = await query(
        `WITH artist_songs AS (
          SELECT s.id
          FROM songs s
          JOIN song_artists sa ON s.id = sa.song_id
          WHERE sa.artist_id = $1
        ),
        playlist_plays AS (
          SELECT 
            p.id,
            COUNT(ph.playlist_id) AS total_plays
          FROM playlists p
          JOIN playlist_songs ps ON p.id = ps.playlist_id
          JOIN artist_songs asongs ON ps.song_id = asongs.id
          LEFT JOIN playlist_history ph ON p.id = ph.playlist_id
            AND ph.played_at >= NOW() - INTERVAL '1 day' * $2
          GROUP BY p.id
        )
        SELECT 
          p.*,
          COALESCE(pp.total_plays, 0) AS total_streams,
          COUNT(DISTINCT pl.user_id) AS likes,
          COUNT(DISTINCT ps.song_id) AS song_count
        FROM playlists p
        JOIN playlist_plays pp ON p.id = pp.id
        LEFT JOIN playlist_likes pl ON p.id = pl.playlist_id
        LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
        WHERE pp.total_plays > 0
        GROUP BY p.id, pp.total_plays
        ORDER BY pp.total_plays DESC
        LIMIT $3`,
        [artistId, days, limit]
      );

      return result.map((playlist) => {
        if (playlist.image_url) {
          playlist.image_url = getBlobUrl(playlist.image_url);
        } else {
          playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
        }
        playlist.type = "playlist";
        return playlist;
      });
    } catch (error) {
      console.error("Error retrieving artist top playlists:", error);
      throw error;
    }
  }

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
