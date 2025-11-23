import type {
  AccessContext,
  Album,
  Artist,
  FeaturedPlaylist,
  Playlist,
  Song,
  UUID,
  AdminDashboardStats,
  UserGrowthData,
  PlatformActivity,
  RecentReport,
  UserInfo,
} from "@types";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { getAccessPredicate } from "@util";
import dotenv from "dotenv";
import { UserRepository } from "@repositories";

dotenv.config();

const API_URL = process.env.API_URL;

export type CoverEntityType = "song" | "playlist" | "album";

export default class AdminService {
  static async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const result = await query(
        `WITH total_users AS (
          SELECT COUNT(*) AS count
          FROM users
          WHERE NOT EXISTS (
            SELECT 1 FROM deleted_users du WHERE du.user_id = users.id
          )
        ),
        total_songs AS (
          SELECT COUNT(*) AS count
          FROM songs
          WHERE NOT EXISTS (
            SELECT 1 FROM deleted_songs ds WHERE ds.song_id = songs.id
          )
        ),
        total_albums AS (
          SELECT COUNT(*) AS count
          FROM albums
          WHERE NOT EXISTS (
            SELECT 1 FROM deleted_albums da WHERE da.album_id = albums.id
          )
        ),
        total_playlists AS (
          SELECT COUNT(*) AS count
          FROM playlists
          WHERE NOT EXISTS (
            SELECT 1 FROM deleted_playlists dp WHERE dp.playlist_id = playlists.id
          )
        ),
        total_streams AS (
          SELECT COALESCE(SUM(streams), 0) AS count
          FROM songs
          WHERE NOT EXISTS (
            SELECT 1 FROM deleted_songs ds WHERE ds.song_id = songs.id
          )
        ),
        total_artists AS (
          SELECT COUNT(*) AS count
          FROM artists
        ),
        active_users AS (
          SELECT COUNT(DISTINCT user_id) AS count
          FROM song_history
          WHERE played_at >= NOW() - INTERVAL '30 days'
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
        totalUsers: parseInt(result[0].total_users) || 0,
        totalSongs: parseInt(result[0].total_songs) || 0,
        totalAlbums: parseInt(result[0].total_albums) || 0,
        totalPlaylists: parseInt(result[0].total_playlists) || 0,
        totalStreams: parseInt(result[0].total_streams) || 0,
        totalArtists: parseInt(result[0].total_artists) || 0,
        activeUsers: parseInt(result[0].active_users) || 0,
        pendingReports: parseInt(result[0].pending_reports) || 0,
      };
    } catch (error) {
      console.error("Error retrieving admin dashboard stats:", error);
      throw error;
    }
  }

  static async getUserGrowth(days: number = 30): Promise<UserGrowthData[]> {
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
            DATE(created_at) AS day,
            COUNT(*) AS count
          FROM users
          WHERE created_at >= CURRENT_DATE - $1::integer
            AND created_at < CURRENT_DATE
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du WHERE du.user_id = users.id
            )
          GROUP BY DATE(created_at)
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
        count: parseInt(row.count) || 0,
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
          WHERE NOT EXISTS (
            SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id
          )
          GROUP BY sa.artist_id
        )
        SELECT
          a.id,
          a.display_name,
          a.verified,
          row_to_json(u.*) as user,
          COALESCE(ast.total_streams, 0) AS streams
        FROM artists a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN artist_streams ast ON a.id = ast.artist_id
        WHERE NOT EXISTS (
          SELECT 1 FROM deleted_users du WHERE du.user_id = u.id
        )
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
            DATE(created_at) AS day,
            COUNT(*) AS count
          FROM songs
          WHERE created_at >= CURRENT_DATE - $1::integer
            AND created_at < CURRENT_DATE
            AND NOT EXISTS (
              SELECT 1 FROM deleted_songs ds WHERE ds.song_id = songs.id
            )
          GROUP BY DATE(created_at)
        ),
        daily_albums AS (
          SELECT
            DATE(created_at) AS day,
            COUNT(*) AS count
          FROM albums
          WHERE created_at >= CURRENT_DATE - $1::integer
            AND created_at < CURRENT_DATE
            AND NOT EXISTS (
              SELECT 1 FROM deleted_albums da WHERE da.album_id = albums.id
            )
          GROUP BY DATE(created_at)
        ),
        daily_playlists AS (
          SELECT
            DATE(created_at) AS day,
            COUNT(*) AS count
          FROM playlists
          WHERE created_at >= CURRENT_DATE - $1::integer
            AND created_at < CURRENT_DATE
            AND NOT EXISTS (
              SELECT 1 FROM deleted_playlists dp WHERE dp.playlist_id = playlists.id
            )
          GROUP BY DATE(created_at)
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
        songs: parseInt(row.songs) || 0,
        albums: parseInt(row.albums) || 0,
        playlists: parseInt(row.playlists) || 0,
      }));
    } catch (error) {
      console.error("Error retrieving platform activity data:", error);
      throw error;
    }
  }

  static async getRecentReports(limit: number = 10, offset: number = 0) {
    try {
      const result = await query(
        `SELECT
          ur.reporter_id,
          ur.reported_id,
          ur.reported_at,
          ur.report_type,
          ur.description,
          ur.report_status,
          u1.username AS reporter_username,
          u2.username AS reported_username
        FROM user_reports ur
        JOIN users u1 ON ur.reporter_id = u1.id
        JOIN users u2 ON ur.reported_id = u2.id
        ORDER BY ur.reported_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result as RecentReport[];
    } catch (error) {
      console.error("Error retrieving recent reports:", error);
      throw error;
    }
  }

  static async getAllUsers(
    limit: number = 50,
    offset: number = 0
  ): Promise<UserInfo[]> {
    try {
      const result = await query(
        `SELECT
          u.*,
          (SELECT COUNT(*)
            FROM user_followers uf
            WHERE uf.following_id = u.id
          ) AS follower_count,
          (SELECT COUNT(*)
            FROM user_followers uf
            WHERE uf.follower_id = u.id
          ) AS following_count,
          (SELECT COUNT(*)
            FROM song_likes sl
            WHERE sl.user_id = u.id
              AND NOT EXISTS (
                SELECT 1 FROM deleted_songs ds
                WHERE ds.song_id = sl.song_id
              )
          ) AS likes_count,
          (SELECT COUNT(*)
            FROM comments c
            WHERE c.user_id = u.id
              AND NOT EXISTS (
                SELECT 1 FROM deleted_songs ds
                WHERE ds.song_id = c.song_id
              )
          ) AS comments_count,
          (SELECT COUNT(*)
            FROM songs s
            WHERE s.owner_id = u.id
              AND NOT EXISTS (
                SELECT 1 FROM deleted_songs ds
                WHERE ds.song_id = s.id
              )
          ) AS songs_count,
          (SELECT COUNT(*)
            FROM albums a
            WHERE a.owner_id = u.id
              AND NOT EXISTS (
                SELECT 1 FROM deleted_albums da
                WHERE da.album_id = a.id
              )
          ) AS albums_count,
          (SELECT COUNT(*)
            FROM playlists p
            WHERE p.owner_id = u.id
              AND NOT EXISTS (
                SELECT 1 FROM deleted_playlists dp
                WHERE dp.playlist_id = p.id
              )
          ) AS playlists_count,
          (SELECT COUNT(*)
            FROM (
              SELECT reported_id FROM song_reports WHERE reported_id = u.id
              UNION ALL
              SELECT reported_id FROM album_reports WHERE reported_id = u.id
              UNION ALL
              SELECT reported_id FROM playlist_reports WHERE reported_id = u.id
              UNION ALL
              SELECT reported_id FROM user_reports WHERE reported_id = u.id
            ) AS all_reports
          ) AS total_reports_count
        FROM users u
        WHERE NOT EXISTS (
          SELECT 1 FROM deleted_users du WHERE du.user_id = u.id
        )
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.map((user) => {
        if (user.profile_picture_url) {
          user.profile_picture_url = getBlobUrl(user.profile_picture_url);
        }
        return user;
      });
    } catch (error) {
      console.error("Error retrieving all users:", error);
      throw error;
    }
  }

  static async suspendUser(userId: UUID) {
    try {
      return UserRepository.update(userId, { status: "SUSPENDED" });
    } catch (error) {
      console.error("Error suspending user:", error);
      throw error;
    }
  }

  static async deactivateUser(userId: UUID) {
    try {
      return UserRepository.update(userId, { status: "DEACTIVATED" });
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  }

  static async reactivateUser(userId: UUID) {
    try {
      return UserRepository.update(userId, { status: "ACTIVE" });
    } catch (error) {
      console.error("Error reactivating user:", error);
      throw error;
    }
  }

  static async verifyArtist(artistId: UUID) {
    try {
      const result = await query(
        `UPDATE artists
        SET verified = true
        WHERE id = $1
        RETURNING *`,
        [artistId]
      );
      return result[0];
    } catch (error) {
      console.error("Error verifying artist:", error);
      throw error;
    }
  }

  static async unverifyArtist(artistId: UUID) {
    try {
      const result = await query(
        `UPDATE artists
        SET verified = false
        WHERE id = $1
        RETURNING *`,
        [artistId]
      );
      return result[0];
    } catch (error) {
      console.error("Error unverifying artist:", error);
      throw error;
    }
  }

  static async getFeaturedPlaylist(
    accessContext: AccessContext
  ): Promise<FeaturedPlaylist | null> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "p");
      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const sql = `
        SELECT p.*,
          row_to_json(u.*) as user,
          (SELECT COUNT(*) FROM playlist_songs ps
          JOIN songs s ON ps.song_id = s.id
          WHERE ps.playlist_id = p.id
            AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
          ) as song_count,
          (SELECT COUNT(*) FROM playlist_likes pl 
            WHERE pl.playlist_id = p.id) AS likes,
          (SELECT COALESCE(SUM(s.duration), 0) 
          FROM songs s
          JOIN playlist_songs ps ON ps.song_id = s.id
          WHERE ps.playlist_id = p.id
            AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
          ) AS runtime,
          (SELECT EXISTS (
            SELECT 1 FROM playlist_songs ps
            JOIN songs s ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id
          AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
          )) AS has_song
        FROM playlists p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN playlist_likes pl ON pl.playlist_id = p.id
        JOIN admin_featured_playlist afp ON afp.playlist_id = p.id
        WHERE (${predicateSql})
        LIMIT 1`;

      const result = await query(sql, [...predicateParams]);
      if (!result || result.length === 0) return null;

      const playlist: FeaturedPlaylist = result[0];

      if (playlist.user?.profile_picture_url) {
        playlist.user.profile_picture_url = getBlobUrl(
          playlist.user.profile_picture_url
        );
      }

      if (playlist.image_url) {
        playlist.image_url = getBlobUrl(playlist.image_url);
      } else if ((playlist as any).has_song) {
        playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
      }

      delete (playlist as any).has_song;
      playlist.type = "playlist";

      return playlist;
    } catch (error) {
      console.error("Error fetching featured playlist:", error);
      throw error;
    }
  }

  static async getEntityImageUrl(
    entityId: UUID,
    entityType: CoverEntityType
  ): Promise<string | null> {
    try {
      let sql;
      switch (entityType) {
        case "song": {
          sql = `SELECT image_url FROM songs
            WHERE id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_songs ds WHERE ds.song_id = songs.id
            )
            LIMIT 1`;
          break;
        }
        case "playlist": {
          sql = `SELECT id, image_url,
            (SELECT EXISTS (
              SELECT 1 FROM playlist_songs ps
              JOIN songs s ON ps.song_id = s.id
              WHERE ps.playlist_id = p.id
              AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
            )) AS has_song
            FROM playlists p
            WHERE id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_playlists dp WHERE dp.playlist_id = p.id
            )
            LIMIT 1`;
          break;
        }
        case "album": {
          sql = `SELECT image_url FROM albums
            WHERE id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_albums da WHERE da.album_id = albums.id
            )
            LIMIT 1`;
          break;
        }
        default:
          throw new Error("Invalid entity type");
      }

      const res = await query(sql, [entityId]);
      if (!res || res.length === 0) return null;

      const entity: Playlist | Song | Album = res[0];

      if (entityType === "playlist") {
        if (entity.image_url) {
          return getBlobUrl(entity.image_url);
        } else if ((entity as any).has_song) {
          return `${API_URL}/playlists/${entity.id}/cover-image`;
        } else {
          return null;
        }
      }

      return entity.image_url ? getBlobUrl(entity.image_url) : null;
    } catch (error) {
      console.error("Error fetching entity image URL:", error);
      throw error;
    }
  }
}
