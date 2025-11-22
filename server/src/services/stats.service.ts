import type { UUID, WeeklyPlays, Song, Playlist, TopListener } from "@types";
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

export default class StatsService {
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
        WHERE NOT EXISTS (
          SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id
        ) 
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
        WHERE sp.recent_plays > 0 AND NOT EXISTS (
          SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id
        )
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

  static async getArtistTopPlaylists(
    artistId: UUID,
    days: number = 30,
    limit: number = 5
  ): Promise<Playlist[]> {
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
          COUNT(DISTINCT ps.song_id) FILTER (WHERE NOT EXISTS (
            SELECT 1 FROM deleted_songs ds WHERE ds.song_id = ps.song_id
          )) AS song_count
        FROM playlists p
        JOIN playlist_plays pp ON p.id = pp.id
        LEFT JOIN playlist_likes pl ON p.id = pl.playlist_id
        LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
        WHERE pp.total_plays > 0 AND NOT EXISTS (
          SELECT 1 FROM deleted_playlists dp WHERE dp.playlist_id = p.id
        )
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

  static async getArtistTopListeners(
    artistId: UUID,
    days: number = 30,
    limit: number = 5
  ): Promise<TopListener[]> {
    try {
      const result = await query(
        `WITH listener_streams AS (
          SELECT 
            sh.user_id,
            COUNT(*) AS streams,
            sh.song_id
          FROM song_history sh
          JOIN song_artists sa ON sh.song_id = sa.song_id
          WHERE sa.artist_id = $1
            AND sh.played_at >= NOW() - INTERVAL '1 day' * $2
          GROUP BY sh.user_id, sh.song_id
        ),
        listener_totals AS (
          SELECT 
            user_id,
            SUM(streams) AS total_streams
          FROM listener_streams
          GROUP BY user_id
        ),
        top_songs AS (
          SELECT DISTINCT ON (ls.user_id)
            ls.user_id,
            s.title AS top_song_title
          FROM listener_streams ls
          JOIN songs s ON ls.song_id = s.id
          ORDER BY ls.user_id, ls.streams DESC
        )
        SELECT 
          u.*,
          lt.total_streams AS streams,
          ts.top_song_title
        FROM users u
        JOIN listener_totals lt ON u.id = lt.user_id
        JOIN top_songs ts ON u.id = ts.user_id
        WHERE NOT EXISTS (
          SELECT 1 FROM deleted_users du WHERE du.user_id = u.id
        )
        ORDER BY lt.total_streams DESC
        LIMIT $3`,
        [artistId, days, limit]
      );

      return result.map((listener) => {
        if (listener.profile_picture_url) {
          listener.profile_picture_url = getBlobUrl(
            listener.profile_picture_url
          );
        }
        listener.type = "user";
        return listener as TopListener;
      });
    } catch (error) {
      console.error("Error retrieving artist top listeners:", error);
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

  static async getArtistRecentRelease(artistId: UUID): Promise<Song | null> {
    try {
      const result = await query(
        `SELECT
          s.*,
          COALESCE(COUNT(DISTINCT sl.user_id), 0) AS likes,
          COALESCE(COUNT(DISTINCT c.id), 0) AS comments
        FROM songs s
        JOIN song_artists sa ON s.id = sa.song_id
        LEFT JOIN song_likes sl ON s.id = sl.song_id
        LEFT JOIN comments c ON s.id = c.song_id
        WHERE sa.artist_id = $1 AND NOT EXISTS (
          SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id
        )
        GROUP BY s.id
        ORDER BY s.release_date DESC
        LIMIT 1`,
        [artistId]
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
      console.error("Error retrieving artist recent release:", error);
      throw error;
    }
  }

  static async getArtistAllTimeStats(artistId: UUID) {
    try {
      const result = await query(
        `WITH artist_songs AS (
          SELECT s.id
          FROM songs s
          JOIN song_artists sa ON s.id = sa.song_id
          WHERE sa.artist_id = $1 AND NOT EXISTS (
            SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id
          )
        ),
        streams_total AS (
          SELECT COALESCE(SUM(s.streams), 0) AS total_streams
          FROM artist_songs asongs
          JOIN songs s ON asongs.id = s.id
          WHERE NOT EXISTS (  
            SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id
          )
        ),
        likes_total AS (
          SELECT COALESCE(COUNT(DISTINCT sl.user_id), 0) AS total_likes
          FROM artist_songs asongs
          LEFT JOIN song_likes sl ON asongs.id = sl.song_id
        ),
        comments_total AS (
          SELECT COALESCE(COUNT(DISTINCT c.id), 0) AS total_comments
          FROM artist_songs asongs
          LEFT JOIN comments c ON asongs.id = c.song_id
          WHERE NOT EXISTS (
            SELECT 1 FROM deleted_songs ds WHERE ds.song_id = c.song_id
          )
        ),
        listeners_total AS (
          SELECT COALESCE(COUNT(DISTINCT sh.user_id), 0) AS total_listeners
          FROM artist_songs asongs
          LEFT JOIN song_history sh ON asongs.id = sh.song_id
          WHERE NOT EXISTS (
            SELECT 1 FROM deleted_songs ds WHERE ds.song_id = sh.song_id
          )
        ),
        songs_count AS (
          SELECT COUNT(DISTINCT id) AS total_songs
          FROM artist_songs
          WHERE NOT EXISTS (
            SELECT 1 FROM deleted_songs ds WHERE ds.song_id = id
          )
        )
        SELECT 
          (SELECT total_streams FROM streams_total) AS streams,
          (SELECT total_likes FROM likes_total) AS likes,
          (SELECT total_comments FROM comments_total) AS comments,
          (SELECT total_listeners FROM listeners_total) AS unique_listeners,
          (SELECT total_songs FROM songs_count) AS total_songs`,
        [artistId]
      );

      if (result.length === 0) {
        return {
          streams: 0,
          likes: 0,
          comments: 0,
          unique_listeners: 0,
          total_songs: 0,
        };
      }

      return {
        streams: parseInt(result[0].streams) || 0,
        likes: parseInt(result[0].likes) || 0,
        comments: parseInt(result[0].comments) || 0,
        unique_listeners: parseInt(result[0].unique_listeners) || 0,
        total_songs: parseInt(result[0].total_songs) || 0,
      };
    } catch (error) {
      console.error("Error retrieving artist all-time stats:", error);
      throw error;
    }
  }

  static async getArtistStreamsBarChartData(
    artistId: UUID,
    timeRange: string = "30d"
  ) {
    try {
      const days =
        timeRange === "7d"
          ? 7
          : timeRange === "90d"
          ? 90
          : timeRange === "1y"
          ? 365
          : 30;

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
        AND NOT EXISTS (
          SELECT 1 FROM deleted_songs ds WHERE ds.song_id = sh.song_id
        )
          GROUP BY DATE(sh.played_at)
        ),
        daily_likes AS (
          SELECT 
        DATE(sl.liked_at) AS day,
        COUNT(*) AS likes
          FROM song_likes sl
          JOIN song_artists sa ON sl.song_id = sa.song_id
          WHERE sa.artist_id = $1
        AND sl.liked_at >= CURRENT_DATE - $2::integer
        AND sl.liked_at < CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1 FROM deleted_songs ds WHERE ds.song_id = sl.song_id
        )
          GROUP BY DATE(sl.liked_at)
        )
        SELECT 
          TO_CHAR(d.day, 'Month') AS month,
          COALESCE(ds.streams, 0) AS streams,
          COALESCE(dl.likes, 0) AS likes
        FROM date_series d
        LEFT JOIN daily_streams ds ON d.day = ds.day
        LEFT JOIN daily_likes dl ON d.day = dl.day
        ORDER BY d.day ASC`,
        [artistId, days]
      );

      return result.map((row) => ({
        month: row.month.trim(),
        streams: parseInt(row.streams) || 0,
        likes: parseInt(row.likes) || 0,
      }));
    } catch (error) {
      console.error("Error retrieving artist streams bar chart data:", error);
      throw error;
    }
  }

  static async getArtistListenersPieChartData(artistId: UUID) {
    try {
      const result = await query(
        `WITH artist_songs AS (
          SELECT s.id
          FROM songs s
          JOIN song_artists sa ON s.id = sa.song_id
          WHERE sa.artist_id = $1
        ),
        listener_counts AS (
          SELECT 
        sh.user_id,
        COUNT(*) AS play_count
          FROM song_history sh
          JOIN artist_songs asongs ON sh.song_id = asongs.id
          WHERE sh.played_at >= NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM deleted_songs ds WHERE ds.song_id = sh.song_id
        )
          GROUP BY sh.user_id
        )
        SELECT 
          COUNT(CASE WHEN play_count > 1 THEN 1 END) AS active_listeners,
          COUNT(CASE WHEN play_count = 1 THEN 1 END) AS first_time_listeners
        FROM listener_counts`,
        [artistId]
      );

      if (result.length === 0) {
        return [
          {
            label: "Active Listener",
            value: 0,
            color: "var(--color-accent)",
          },
          {
            label: "First-Time Listener",
            value: 0,
            color: "var(--color-accent-400)",
          },
        ];
      }

      return [
        {
          label: "Active Listener",
          value: parseInt(result[0].active_listeners) || 0,
          color: "var(--color-accent)",
        },
        {
          label: "First-Time Listener",
          value: parseInt(result[0].first_time_listeners) || 0,
          color: "var(--color-accent-400)",
        },
      ];
    } catch (error) {
      console.error("Error retrieving artist listeners pie chart data:", error);
      throw error;
    }
  }

  static async getArtistFollowersData(artistId: UUID) {
    try {
      const result = await query(
        `WITH RECURSIVE month_series AS (
          SELECT 
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')::date AS month_start,
        0 AS month_num
          UNION ALL
          SELECT 
        (month_start + INTERVAL '1 month')::date,
        month_num + 1
          FROM month_series
          WHERE month_num < 11
        ),
        monthly_followers AS (
          SELECT 
        ms.month_start,
        COUNT(DISTINCT uf.follower_id) AS follower_count
          FROM month_series ms
          LEFT JOIN users u ON u.artist_id = $1
          LEFT JOIN user_followers uf ON uf.following_id = u.id
        AND uf.followed_at < (ms.month_start + INTERVAL '1 month')::date
          WHERE NOT EXISTS (
        SELECT 1 FROM deleted_users du WHERE du.user_id = u.id
          )
          GROUP BY ms.month_start
          ORDER BY ms.month_start ASC
        )
        SELECT 
          TO_CHAR(month_start, 'Mon') AS date,
          follower_count AS followers
        FROM monthly_followers`,
        [artistId]
      );

      return {
        dates: result.map((row) => row.date),
        followers: result.map((row) => parseInt(row.followers) || 0),
      };
    } catch (error) {
      console.error("Error retrieving artist followers data:", error);
      throw error;
    }
  }
}
