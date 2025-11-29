import type {
  UUID,
  WeeklyPlays,
  Song,
  Playlist,
  TopListener,
  AdminDashboardStats,
  AdminUserGrowthData,
  PlatformActivity,
  Artist,
  ArtistQuickStats,
} from "@types";
import { notDeletedCondition } from "@util";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export default class StatsService {
  // Song Stats
  static async getWeeklyPlays(songId: UUID): Promise<WeeklyPlays> {
    try {
      const result = await query(
        `WITH weekly_plays AS (
          SELECT 
            DATE_TRUNC('week', played_at) AS week_start,
            COUNT(*) AS play_count
          FROM song_history
          WHERE song_id = $1 AND NOT EXISTS (
            SELECT 1 FROM deleted_songs ds WHERE ds.song_id = song_history.song_id
          )
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

  // Admin Dashboard Stats
  static async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const result = await query(
        `WITH total_users AS (
            SELECT COUNT(*) AS count
            FROM users u
            WHERE ${notDeletedCondition("user", "u")}
          ),
          total_songs AS (
            SELECT COUNT(*) AS count
            FROM songs s
            WHERE ${notDeletedCondition("song", "s")}
          ),
          total_albums AS (
            SELECT COUNT(*) AS count
            FROM albums a
            WHERE ${notDeletedCondition("album", "a")}
          ),
          total_playlists AS (
            SELECT COUNT(*) AS count
            FROM playlists p
            WHERE ${notDeletedCondition("playlist", "p")}
          ),
          total_streams AS (
            SELECT COALESCE(SUM(s.streams), 0) AS count
            FROM songs s
            WHERE ${notDeletedCondition("song", "s")}
          ),
          total_artists AS (
            SELECT COUNT(*) AS count
            FROM artists a
            WHERE ${notDeletedCondition("artist", "a")}
          ),
          active_users AS (
            SELECT COUNT(DISTINCT sh.user_id) AS count
            FROM song_history sh
            JOIN users u ON u.id = sh.user_id
            JOIN songs s ON s.id = sh.song_id
            WHERE sh.played_at >= NOW() - INTERVAL '30 days'
              AND ${notDeletedCondition("user", "u")}
              AND ${notDeletedCondition("song", "s")}
          ),
          pending_reports AS (
            SELECT COUNT(*) AS count
            FROM user_reports
            WHERE report_status = 'PENDING'
          )
          SELECT
            (SELECT count FROM total_users) AS total_users,
            (SELECT count FROM total_songs) AS total_songs,
            (SELECT count FROM total_albums) AS total_albums,
            (SELECT count FROM total_playlists) AS total_playlists,
            (SELECT count FROM total_streams) AS total_streams,
            (SELECT count FROM total_artists) AS total_artists,
            (SELECT count FROM active_users) AS active_users,
            (SELECT count FROM pending_reports) AS pending_reports`
      );

      if (result.length === 0) {
        return {
          totalUsers: 0,
          totalSongs: 0,
          totalAlbums: 0,
          totalPlaylists: 0,
          totalStreams: 0,
          totalArtists: 0,
          activeUsers: 0,
          pendingReports: 0,
        };
      }

      return {
        totalUsers: parseInt(result[0].total_users) ?? 0,
        totalSongs: parseInt(result[0].total_songs) ?? 0,
        totalAlbums: parseInt(result[0].total_albums) ?? 0,
        totalPlaylists: parseInt(result[0].total_playlists) ?? 0,
        totalStreams: parseInt(result[0].total_streams) ?? 0,
        totalArtists: parseInt(result[0].total_artists) ?? 0,
        activeUsers: parseInt(result[0].active_users) ?? 0,
        pendingReports: parseInt(result[0].pending_reports) ?? 0,
      };
    } catch (error) {
      console.error("Error retrieving admin dashboard stats:", error);
      throw error;
    }
  }

  static async getUserGrowth(
    days: number = 30
  ): Promise<AdminUserGrowthData[]> {
    try {
      const result = await query(
        `WITH date_series AS (
            SELECT generate_series(
              CURRENT_DATE - $1::integer,
              CURRENT_DATE - 1,
              '1 day'::interval
            )::date AS day
          ),
          daily_users AS (
            SELECT
              DATE(u.created_at) AS day,
              COUNT(*) AS count
            FROM users u
            WHERE u.created_at >= CURRENT_DATE - $1::integer
              AND u.created_at < CURRENT_DATE
              AND ${notDeletedCondition("user", "u")}
            GROUP BY DATE(u.created_at)
          )
          SELECT
            TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
            COALESCE(du.count, 0) AS count
          FROM date_series d
          LEFT JOIN daily_users du ON d.day = du.day
          ORDER BY d.day ASC`,
        [days]
      );

      return result.map((row) => ({
        date: row.date,
        count: parseInt(row.count) ?? 0,
      }));
    } catch (error) {
      console.error("Error retrieving user growth data:", error);
      throw error;
    }
  }

  static async getTopArtists(limit: number = 10): Promise<Artist[]> {
    try {
      const result = await query(
        `WITH artist_streams AS (
            SELECT
              sa.artist_id,
              COALESCE(SUM(s.streams), 0) AS total_streams
            FROM song_artists sa
            JOIN songs s ON sa.song_id = s.id
            WHERE ${notDeletedCondition("song", "s")}
            GROUP BY sa.artist_id
          )
          SELECT
            a.id,
            a.display_name,
            a.verified,
            a.bio,
            a.user_id,
            a.location,
            a.created_at,
            a.updated_at,
            row_to_json(u.*) as user,
            COALESCE(ast.total_streams, 0) AS streams
          FROM artists a
          JOIN users u ON a.user_id = u.id
          LEFT JOIN artist_streams ast ON a.id = ast.artist_id
          WHERE ${notDeletedCondition("artist", "a")}
            AND ${notDeletedCondition("user", "u")}
          ORDER BY ast.total_streams DESC NULLS LAST
          LIMIT $1`,
        [limit]
      );

      return result.map((artist) => {
        if (artist.user?.profile_picture_url) {
          artist.user.profile_picture_url = getBlobUrl(
            artist.user.profile_picture_url
          );
        }
        artist.type = "artist";
        return artist;
      });
    } catch (error) {
      console.error("Error retrieving top artists:", error);
      throw error;
    }
  }

  static async getPlatformActivity(
    days: number = 30
  ): Promise<PlatformActivity[]> {
    try {
      const result = await query(
        `WITH date_series AS (
            SELECT generate_series(
              CURRENT_DATE - $1::integer,
              CURRENT_DATE - 1,
              '1 day'::interval
            )::date AS day
          ),
          daily_songs AS (
            SELECT
              DATE(s.created_at) AS day,
              COUNT(*) AS count
            FROM songs s
            WHERE s.created_at >= CURRENT_DATE - $1::integer
              AND s.created_at < CURRENT_DATE
              AND ${notDeletedCondition("song", "s")}
            GROUP BY DATE(s.created_at)
          ),
          daily_albums AS (
            SELECT
              DATE(a.created_at) AS day,
              COUNT(*) AS count
            FROM albums a
            WHERE a.created_at >= CURRENT_DATE - $1::integer
              AND a.created_at < CURRENT_DATE
              AND ${notDeletedCondition("album", "a")}
            GROUP BY DATE(a.created_at)
          ),
          daily_playlists AS (
            SELECT
              DATE(p.created_at) AS day,
              COUNT(*) AS count
            FROM playlists p
            WHERE p.created_at >= CURRENT_DATE - $1::integer
              AND p.created_at < CURRENT_DATE
              AND ${notDeletedCondition("playlist", "p")}
            GROUP BY DATE(p.created_at)
          )
          SELECT
            TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
            COALESCE(ds.count, 0) AS songs,
            COALESCE(da.count, 0) AS albums,
            COALESCE(dp.count, 0) AS playlists
          FROM date_series d
          LEFT JOIN daily_songs ds ON d.day = ds.day
          LEFT JOIN daily_albums da ON d.day = da.day
          LEFT JOIN daily_playlists dp ON d.day = dp.day
          ORDER BY d.day ASC`,
        [days]
      );

      return result.map((row) => ({
        date: row.date,
        songs: parseInt(row.songs) ?? 0,
        albums: parseInt(row.albums) ?? 0,
        playlists: parseInt(row.playlists) ?? 0,
      }));
    } catch (error) {
      console.error("Error retrieving platform activity data:", error);
      throw error;
    }
  }

  // Artist Dashboard Stats
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
          JOIN songs s ON s.id = sh.song_id
          JOIN users u ON u.id = sh.user_id
          WHERE sa.artist_id = $1
            AND sh.played_at >= NOW() - INTERVAL '1 day' * $2
            AND ${notDeletedCondition("song", "s")}
            AND ${notDeletedCondition("user", "u")}
        ),
        streams AS (
          SELECT COUNT(*) AS count
          FROM song_history sh
          JOIN song_artists sa ON sh.song_id = sa.song_id
          JOIN songs s ON s.id = sh.song_id
          WHERE sa.artist_id = $1
            AND sh.played_at >= NOW() - INTERVAL '1 day' * $2
            AND ${notDeletedCondition("song", "s")}
        ),
        new_followers AS (
          SELECT COUNT(*) AS count
          FROM user_followers uf
          JOIN users u ON uf.following_id = u.id
          JOIN users follower ON follower.id = uf.follower_id
          WHERE u.artist_id = $1
            AND uf.followed_at >= NOW() - INTERVAL '1 day' * $2
            AND ${notDeletedCondition("user", "u")}
            AND ${notDeletedCondition("user", "follower")}
        ),
        playlist_adds AS (
          SELECT COUNT(*) AS count
          FROM playlist_songs ps
          JOIN song_artists sa ON ps.song_id = sa.song_id
          JOIN songs s ON s.id = ps.song_id
          JOIN playlists p ON p.id = ps.playlist_id
          WHERE sa.artist_id = $1
            AND ps.added_at >= NOW() - INTERVAL '1 day' * $2
            AND ${notDeletedCondition("song", "s")}
            AND ${notDeletedCondition("playlist", "p")}
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
        listeners: parseInt(result[0].listeners) ?? 0,
        streams: parseInt(result[0].streams) ?? 0,
        newFollowers: parseInt(result[0].new_followers) ?? 0,
        playlistAdds: parseInt(result[0].playlist_adds) ?? 0,
      };
    } catch (error) {
      console.error("Error retrieving artist quick stats:", error);
      throw error;
    }
  }

  static async getArtistTopSong(
    artistId: UUID,
    userId: UUID,
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
            AND sh.played_at >= NOW() - INTERVAL '1 day' * $3
          WHERE sa.artist_id = $1
            AND ${notDeletedCondition("song", "s")}
            AND (s.visibility_status = 'PUBLIC' OR s.owner_id = $2)
          GROUP BY s.id
        )
        SELECT
          s.*,
          COALESCE(COUNT(DISTINCT sl.user_id), 0) AS likes,
          COALESCE(COUNT(DISTINCT c.id) FILTER (WHERE ${notDeletedCondition(
            "comment",
            "c"
          )}), 0) AS comments
        FROM songs s
        JOIN song_plays sp ON s.id = sp.id
        LEFT JOIN song_likes sl ON s.id = sl.song_id
        LEFT JOIN comments c ON s.id = c.song_id
        WHERE ${notDeletedCondition("song", "s")}
          AND (s.visibility_status = 'PUBLIC' OR s.owner_id = $2)
        GROUP BY s.id, sp.recent_plays
        ORDER BY sp.recent_plays DESC, s.streams DESC
        LIMIT 1`,
        [artistId, userId, days]
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
          JOIN songs s ON s.id = sh.song_id
          WHERE sa.artist_id = $1
            AND sh.played_at >= CURRENT_DATE - $2::integer
            AND sh.played_at < CURRENT_DATE
            AND ${notDeletedCondition("song", "s")}
          GROUP BY DATE(sh.played_at)
        )
        SELECT
          COALESCE(ds.streams, 0) AS streams
        FROM date_series d
        LEFT JOIN daily_streams ds ON d.day = ds.day
        ORDER BY d.day ASC`,
        [artistId, days]
      );

      return result.map((row) => parseInt(row.streams) ?? 0);
    } catch (error) {
      console.error("Error retrieving artist daily streams:", error);
      throw error;
    }
  }

  static async getArtistTopSongs(
    artistId: UUID,
    userId: UUID,
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
            AND sh.played_at >= NOW() - INTERVAL '1 day' * $3
          WHERE sa.artist_id = $1
            AND ${notDeletedCondition("song", "s")}
            AND (s.visibility_status = 'PUBLIC' OR s.owner_id = $2)
          GROUP BY s.id
        )
        SELECT
          s.*
        FROM songs s
        JOIN song_plays sp ON s.id = sp.id
        WHERE sp.recent_plays > 0
        ORDER BY sp.recent_plays DESC, s.streams DESC
        LIMIT $4`,
        [artistId, userId, days, limit]
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
    userId: UUID,
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
            AND ${notDeletedCondition("song", "s")}
            AND (s.visibility_status = 'PUBLIC' OR s.owner_id = $2)
        ),
        playlist_plays AS (
          SELECT
            p.id,
            COUNT(ph.playlist_id) AS total_plays
          FROM playlists p
          JOIN playlist_songs ps ON p.id = ps.playlist_id
          JOIN artist_songs asongs ON ps.song_id = asongs.id
          LEFT JOIN playlist_history ph ON p.id = ph.playlist_id
            AND ph.played_at >= NOW() - INTERVAL '1 day' * $3
          WHERE ${notDeletedCondition("playlist", "p")}
            AND (p.visibility_status = 'PUBLIC' OR p.owner_id = $2)
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
        WHERE pp.total_plays > 0
        GROUP BY p.id, pp.total_plays
        ORDER BY pp.total_plays DESC
        LIMIT $4`,
        [artistId, userId, days, limit]
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
    userId: UUID,
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
          JOIN songs s ON s.id = sh.song_id
          WHERE sa.artist_id = $1
            AND sh.played_at >= NOW() - INTERVAL '1 day' * $3
            AND ${notDeletedCondition("song", "s")}
            AND (s.visibility_status = 'PUBLIC' OR s.owner_id = $2)
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
          WHERE ${notDeletedCondition("song", "s")}
          ORDER BY ls.user_id, ls.streams DESC
        )
        SELECT
          u.*,
          lt.total_streams AS streams,
          ts.top_song_title
        FROM users u
        JOIN listener_totals lt ON u.id = lt.user_id
        JOIN top_songs ts ON u.id = ts.user_id
        WHERE ${notDeletedCondition("user", "u")}
          AND (
            (u.status = 'ACTIVE' AND u.is_private = FALSE)
            OR (u.id = $2 AND u.status IN ('ACTIVE', 'DEACTIVATED'))
          )
        ORDER BY lt.total_streams DESC
        LIMIT $4`,
        [artistId, userId, days, limit]
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

  static async getArtistRecentRelease(
    artistId: UUID,
    userId: UUID
  ): Promise<Song | null> {
    try {
      const result = await query(
        `SELECT
          s.*,
          COALESCE(COUNT(DISTINCT sl.user_id), 0) AS likes,
          COALESCE(COUNT(DISTINCT c.id) FILTER (WHERE ${notDeletedCondition(
            "comment",
            "c"
          )}), 0) AS comments
        FROM songs s
        JOIN song_artists sa ON s.id = sa.song_id
        LEFT JOIN song_likes sl ON s.id = sl.song_id
        LEFT JOIN comments c ON s.id = c.song_id
        WHERE sa.artist_id = $1
          AND ${notDeletedCondition("song", "s")}
          AND (s.visibility_status = 'PUBLIC' OR s.owner_id = $2)
        GROUP BY s.id
        ORDER BY s.release_date DESC
        LIMIT 1`,
        [artistId, userId]
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

  static async getArtistAllTimeStats(artistId: UUID, userId: UUID) {
    try {
      const result = await query(
        `WITH artist_songs AS (
          SELECT s.id
          FROM songs s
          JOIN song_artists sa ON s.id = sa.song_id
          WHERE sa.artist_id = $1
            AND ${notDeletedCondition("song", "s")}
            AND (s.visibility_status = 'PUBLIC' OR s.owner_id = $2)
        ),
        streams_total AS (
          SELECT COALESCE(SUM(s.streams), 0) AS total_streams
          FROM artist_songs asongs
          JOIN songs s ON asongs.id = s.id
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
          WHERE ${notDeletedCondition("comment", "c")}
        ),
        listeners_total AS (
          SELECT COALESCE(COUNT(DISTINCT sh.user_id), 0) AS total_listeners
          FROM artist_songs asongs
          LEFT JOIN song_history sh ON asongs.id = sh.song_id
          JOIN users u ON u.id = sh.user_id
          WHERE ${notDeletedCondition("user", "u")}
        ),
        songs_count AS (
          SELECT COUNT(DISTINCT id) AS total_songs
          FROM artist_songs
        )
        SELECT
          (SELECT total_streams FROM streams_total) AS streams,
          (SELECT total_likes FROM likes_total) AS likes,
          (SELECT total_comments FROM comments_total) AS comments,
          (SELECT total_listeners FROM listeners_total) AS unique_listeners,
          (SELECT total_songs FROM songs_count) AS total_songs`,
        [artistId, userId]
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
        streams: parseInt(result[0].streams) ?? 0,
        likes: parseInt(result[0].likes) ?? 0,
        comments: parseInt(result[0].comments) ?? 0,
        unique_listeners: parseInt(result[0].unique_listeners) ?? 0,
        total_songs: parseInt(result[0].total_songs) ?? 0,
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
        streams: parseInt(row.streams) ?? 0,
        likes: parseInt(row.likes) ?? 0,
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
            AND ${notDeletedCondition("song", "s")}
            AND s.visibility_status = 'PUBLIC'
        ),
        listener_counts AS (
          SELECT
            sh.user_id,
            COUNT(*) AS play_count
          FROM song_history sh
          JOIN artist_songs asongs ON sh.song_id = asongs.id
          JOIN users u ON u.id = sh.user_id
          WHERE sh.played_at >= NOW() - INTERVAL '30 days'
            AND ${notDeletedCondition("user", "u")}
            AND u.status = 'ACTIVE'
            AND u.is_private = FALSE
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
          value: parseInt(result[0].active_listeners) ?? 0,
          color: "var(--color-accent)",
        },
        {
          label: "First-Time Listener",
          value: parseInt(result[0].first_time_listeners) ?? 0,
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
          LEFT JOIN users follower ON follower.id = uf.follower_id
          WHERE ${notDeletedCondition("user", "u")}
            AND (follower.id IS NULL OR ${notDeletedCondition(
              "user",
              "follower"
            )})
            AND (follower.id IS NULL OR (follower.status = 'ACTIVE' AND follower.is_private = FALSE))
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
        followers: result.map((row) => parseInt(row.followers) ?? 0),
      };
    } catch (error) {
      console.error("Error retrieving artist followers data:", error);
      throw error;
    }
  }
}
