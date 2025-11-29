import type {
  Album,
  FeaturedPlaylist,
  Playlist,
  Song,
  UUID,
  UserInfo,
  UserOrderByColumn,
  OrderByDirection,
} from "@types";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { isDeleted, notDeletedCondition } from "@util";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export type CoverEntityType = "song" | "playlist" | "album";

export default class AdminService {
  static async getUsersInfo(options?: {
    orderByColumn?: UserOrderByColumn;
    orderByDirection?: OrderByDirection;
    limit?: number;
    offset?: number;
  }): Promise<UserInfo[]> {
    try {
      const orderByColumn = options?.orderByColumn || "created_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<UserOrderByColumn, string> = {
        username: "u.username",
        role: "u.role",
        created_at: "u.created_at",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT
          u.*,
          (
            SELECT COUNT(*)
            FROM user_followers uf
            WHERE uf.following_id = u.id
          ) AS follower_count,
          (
            SELECT COUNT(*)
            FROM user_followers uf
            WHERE uf.follower_id = u.id
          ) AS following_count,
          (
            SELECT COUNT(*)
            FROM song_likes sl
            JOIN songs s ON s.id = sl.song_id
            WHERE sl.user_id = u.id
              AND ${notDeletedCondition("song", "s")}
          ) AS likes_count,
          (
            SELECT COUNT(*)
            FROM comments c
            JOIN songs s ON s.id = c.song_id
            WHERE c.user_id = u.id
              AND ${notDeletedCondition("comment", "c")}
              AND ${notDeletedCondition("song", "s")}
          ) AS comments_count,
          (
            SELECT COUNT(*)
            FROM songs s
            WHERE s.owner_id = u.id
              AND ${notDeletedCondition("song", "s")}
          ) AS songs_count,
          (
            SELECT COUNT(*)
            FROM albums a
            WHERE a.owner_id = u.id
              AND ${notDeletedCondition("album", "a")}
          ) AS albums_count,
          (
            SELECT COUNT(*)
            FROM playlists p
            WHERE p.owner_id = u.id
              AND ${notDeletedCondition("playlist", "p")}
          ) AS playlists_count,
          (
            SELECT COUNT(*)
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
        WHERE ${notDeletedCondition("user", "u")}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $1 OFFSET $2
      `;

      const result = await query(sql, [limit, offset]);

      return result.map((user) => {
        if (user.profile_picture_url) {
          user.profile_picture_url = getBlobUrl(user.profile_picture_url);
        }
        return user;
      });
    } catch (error) {
      console.error("Error retrieving users info:", error);
      throw error;
    }
  }

  static async setFeaturedPlaylist(playlistId: UUID) {
    try {
      const playlistDeleted = await isDeleted(playlistId, "playlist");
      if (playlistDeleted) {
        throw new Error("Cannot feature a deleted playlist");
      }

      await query(
        `INSERT INTO admin_featured_playlist (playlist_id) VALUES ($1)`,
        [playlistId]
      );
      return { success: true };
    } catch (error) {
      console.error("Error setting featured playlist:", error);
      throw error;
    }
  }

  static async getFeaturedPlaylist(): Promise<FeaturedPlaylist | null> {
    try {
      const sql = `
        SELECT 
          p.*,
          afp.featured_at AS featured_at,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = p.owner_id
                AND ${notDeletedCondition("user", "u")}
                AND u.status = 'ACTIVE'
                AND u.is_private = FALSE
            ) AS user_data
          ) AS user,
          (
            SELECT COUNT(*)
            FROM playlist_likes pl
            WHERE pl.playlist_id = p.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT COALESCE(SUM(s.duration), 0)
            FROM songs s
            JOIN playlist_songs ps ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT json_agg(ps.song_id ORDER BY ps.position)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids,
          (
            SELECT EXISTS (
              SELECT 1
              FROM playlist_songs ps
              JOIN songs s ON s.id = ps.song_id
              WHERE ps.playlist_id = p.id
                AND ${notDeletedCondition("song", "s")}
            )
          ) AS has_song
        FROM playlists p
        JOIN admin_featured_playlist afp ON afp.playlist_id = p.id
        WHERE ${notDeletedCondition("playlist", "p")}
          AND p.visibility_status = 'PUBLIC'
        LIMIT 1
      `;

      const result = await query(sql);
      if (!result || result.length === 0) {
        return null;
      }

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

  //move to indiv repo
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
