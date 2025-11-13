import type { UUID, Song, Album, Playlist, User, Comment } from "@types";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";

type LikeableEntity = "song" | "album" | "playlist" | "comment";

type LikeableEntitiesMap = {
  song: Song;
  album: Album;
  playlist: Playlist;
  comment: Comment;
};

const LIKE_FUNCTIONS: Record<LikeableEntity, string> = {
  song: "toggle_song_like",
  album: "toggle_album_like",
  playlist: "toggle_playlist_like",
  comment: "toggle_comment_like",
};

const LIKE_TABLES: Record<LikeableEntity, string> = {
  song: "song_likes",
  album: "album_likes",
  playlist: "playlist_likes",
  comment: "comment_likes",
};

/**
 * Service for managing likes on songs, albums, playlists, and comments.
 */
export default class LikeService {
  /**
   * Toggles a like for a given entity (song, album, playlist, comment) by a user.
   * @param userId The ID of the user.
   * @param entityId The ID of the entity to like/unlike.
   * @param entity The type of entity (song, album, playlist, comment).
   * @return A string indicating the action ("liked"/"unliked").
   * @throws Error if the operation fails.
   */
  static async toggleLike(
    userId: UUID,
    entityId: UUID,
    entity: LikeableEntity
  ): Promise<string> {
    try {
      const fn = LIKE_FUNCTIONS[entity];
      if (!fn) {
        throw new Error("Invalid entity type");
      }

      const res = await query(`SELECT action FROM ${fn}($1, $2)`, [
        userId,
        entityId,
      ]);
      return res[0]?.action ?? null;
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }

  /**
   * Get the number of likes for an entity.
   * @param entityId The ID of the entity.
   * @param entity The type of entity (song, album, playlist, comment).
   * @return The number of likes.
   * @throws Error if the operation fails.
   */
  static async getLikeCount(
    entityId: UUID,
    entity: LikeableEntity
  ): Promise<number> {
    try {
      const table = LIKE_TABLES[entity];
      if (!table) {
        throw new Error("Invalid entity type");
      }

      const res = await query(
        `SELECT COUNT(*) FROM ${table} WHERE ${entity}_id = $1`,
        [entityId]
      );
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error getting like count:", error);
      throw error;
    }
  }

  static async getLikedByUser<K extends keyof LikeableEntitiesMap>(
    userId: UUID,
    entity: K,
    options?: { limit?: number; offset?: number; [key: string]: any }
  ): Promise<LikeableEntitiesMap[K][]> {
    const likeTable = LIKE_TABLES[entity];

    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    let sql = "";
    let params: any[] = [];

    switch (entity) {
      case "song": {
        sql = `
          SELECT s.*,
            CASE WHEN $2 THEN
              (SELECT json_agg(row_to_json(album_with_artist))
              FROM (
                SELECT a.*,
                  row_to_json(ar) AS artist
                FROM albums a
                JOIN album_songs als ON als.album_id = a.id
                LEFT JOIN artists ar ON ar.id = a.created_by
                WHERE als.song_id = s.id
              ) AS album_with_artist)
            ELSE NULL END AS albums,
            CASE WHEN $3 THEN
              (SELECT json_agg(row_to_json(ar_with_role))
              FROM (
                SELECT
                  ar.*,
                  sa.role,
                  row_to_json(u) AS user
                FROM artists ar
                JOIN users u ON u.artist_id = ar.id
                JOIN song_artists sa ON sa.artist_id = ar.id
                WHERE sa.song_id = s.id
              ) AS ar_with_role)
            ELSE NULL END AS artists,
            CASE WHEN $4 THEN
              (SELECT COUNT(*) FROM song_likes sl
              WHERE sl.song_id = s.id)
            ELSE NULL END AS likes,
            CASE WHEN $5 THEN
              (SELECT COUNT(*) FROM comments c
              WHERE c.song_id = s.id)
            ELSE NULL END AS comments
          FROM songs s
          JOIN ${likeTable} l ON s.id = l.song_id
          WHERE l.user_id = $1
          LIMIT $6 OFFSET $7
        `;
        params = [
          userId,
          options?.includeAlbums ?? false,
          options?.includeArtists ?? false,
          options?.includeLikes ?? false,
          options?.includeComments ?? false,
          limit,
          offset,
        ];
        break;
      }

      case "album": {
        sql = `
          SELECT a.*,
          CASE WHEN $2 THEN 
            (SELECT row_to_json(artist_with_user)
            FROM (
              SELECT ar.*,
                row_to_json(u) AS user
              FROM artists ar
              LEFT JOIN users u ON ar.user_id = u.id
              WHERE ar.id = a.created_by
            ) AS artist_with_user)
          ELSE NULL END as artist,
          CASE WHEN $3 THEN (SELECT COUNT(*) FROM album_likes al 
            WHERE al.album_id = a.id) 
          ELSE NULL END as likes,
          CASE WHEN $4 THEN (SELECT SUM(s.duration) FROM songs s 
            JOIN album_songs als ON s.id = als.song_id 
            WHERE als.album_id = a.id) 
          ELSE NULL END as runtime,
          CASE WHEN $5 THEN (SELECT COUNT(*) FROM album_songs als 
            WHERE als.album_id = a.id)
          ELSE NULL END as song_count
          FROM albums a
          JOIN ${likeTable} l ON a.id = l.album_id
          WHERE l.user_id = $1
          LIMIT $6 OFFSET $7
        `;
        params = [
          userId,
          options?.includeArtist ?? false,
          options?.includeLikes ?? false,
          options?.includeRuntime ?? false,
          options?.includeSongCount ?? false,
          limit,
          offset,
        ];
        break;
      }

      case "playlist": {
        sql = `
          SELECT p.*,
          CASE WHEN $2 THEN row_to_json(u.*)
          ELSE NULL END as user,
          CASE WHEN $3 THEN (SELECT COUNT(*) FROM playlist_likes pl
            WHERE pl.playlist_id = p.id)
          ELSE NULL END as likes,
          CASE WHEN $4 THEN (SELECT COUNT(*) FROM playlist_songs ps
            WHERE ps.playlist_id = p.id)
          ELSE NULL END as song_count,
          CASE WHEN $5 THEN (SELECT COALESCE(SUM(s.duration), 0) FROM songs s
            JOIN playlist_songs ps ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id)
          ELSE NULL END as runtime
          FROM playlists p
          LEFT JOIN users u ON p.created_by = u.id
          JOIN ${likeTable} l ON p.id = l.playlist_id
          WHERE l.user_id = $1
          LIMIT $6 OFFSET $7
        `;
        params = [
          userId,
          options?.includeUser ?? false,
          options?.includeLikes ?? false,
          options?.includeSongCount ?? false,
          options?.includeRuntime ?? false,
          limit,
          offset,
        ];
        break;
      }

      case "comment": {
        sql = `
          SELECT c.*
          FROM comments c
          JOIN ${likeTable} l ON c.id = l.comment_id
          WHERE l.user_id = $1
          LIMIT $2 OFFSET $3
        `;
        params = [userId, limit, offset];
        break;
      }

      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }

    const results = await query(sql, params);
    if (!results || results.length === 0) {
      return [];
    }

    const processedItems = await Promise.all(
      results.map(async (item: any) => {
        switch (entity) {
          case "song": {
            if (item.image_url) {
              item.image_url = getBlobUrl(item.image_url);
            }
            if (item.audio_url) {
              item.audio_url = getBlobUrl(item.audio_url);
            }
            if (item.albums && item.albums?.length > 0) {
              item.albums = item.albums.map((album: any) => {
                if (album.image_url) {
                  album.image_url = getBlobUrl(album.image_url);
                }
                if (album.artist) {
                  album.artist.type = "artist";
                }
                album.type = "album";
                return album;
              });
            }
            if (item.artists && item.artists?.length > 0) {
              item.artists = item.artists.map((artist: any) => {
                if (artist.user && artist.user.profile_picture_url) {
                  artist.user.profile_picture_url = getBlobUrl(
                    artist.user.profile_picture_url
                  );
                }
                artist.type = "artist";
                return artist;
              });
            }
            item.type = "song";
            break;
          }

          case "album": {
            if (item.image_url) {
              item.image_url = getBlobUrl(item.image_url);
            }
            if (item.artist) {
              if (item.artist.user && item.artist.user.profile_picture_url) {
                item.artist.user.profile_picture_url = getBlobUrl(
                  item.artist.user.profile_picture_url
                );
              }
              item.artist.type = "artist";
            }
            item.type = "album";
            break;
          }

          case "playlist": {
            if (item.user && item.user.profile_picture_url) {
              item.user.profile_picture_url = getBlobUrl(
                item.user.profile_picture_url
              );
            }
            item.image_url = `${process.env.API_URL}/playlists/${item.id}/cover-image`;
            item.type = "playlist";
            break;
          }

          case "comment": {
            if (item.profile_picture_url) {
              item.profile_picture_url = getBlobUrl(item.profile_picture_url);
            }
            break;
          }
        }

        return item;
      })
    );

    return processedItems as LikeableEntitiesMap[K][];
  }

  /**
   * Get the count of entities liked by a user.
   * @param userId The ID of the user.
   * @param entity The type of entity (song, album, playlist, comment).
   * @return The number of entities liked by the user.
   * @throws Error if the operation fails.
   */
  static async getLikedCount<K extends keyof LikeableEntitiesMap>(
    userId: UUID,
    entity: K
  ): Promise<number> {
    const likeTable = LIKE_TABLES[entity];

    const res = await query(
      `SELECT COUNT(*) FROM ${likeTable}
      WHERE user_id = $1`,
      [userId]
    );

    return parseInt(res[0]?.count ?? "0", 10);
  }

  /**
   * Get all users who liked an entity.
   * @param entityId The ID of the entity.
   * @param entity The type of entity (song, album, playlist, comment).
   * @param options Optional parameters for pagination.
   * @param options.limit The maximum number of users to return.
   * @param options.offset The number of users to skip.
   * @return An array of users who liked the entity.
   * @throws Error if the operation fails.
   */
  static async getUsersWhoLiked<K extends keyof LikeableEntitiesMap>(
    entityId: UUID,
    entity: K,
    options?: { limit?: number; offset?: number }
  ): Promise<User[]> {
    const likeTable = LIKE_TABLES[entity];
    if (!likeTable) {
      throw new Error("Invalid entity type");
    }

    const params = [entityId, options?.limit || 50, options?.offset || 0];
    const sql = `
      SELECT u.* FROM users u
      JOIN ${likeTable} l ON u.id = l.user_id
      WHERE l.${entity}_id = $1
      LIMIT $2 OFFSET $3
    `;

    const users = await query(sql, params);
    if (!users || users.length === 0) {
      return [];
    }

    const processedUsers = await Promise.all(
      users.map(async (user: User) => {
        if (user.profile_picture_url) {
          user.profile_picture_url = getBlobUrl(user.profile_picture_url);
        }
        return user;
      })
    );

    return processedUsers;
  }

  /**
   * Checks if a user has liked an entity.
   * @param userId The ID of the user.
   * @param entityId The ID of the entity.
   * @param entity The type of entity (song, album, playlist, comment).
   * @return Boolean indicating whether the user has liked the entity.
   * @throws Error if the operation fails.
   */
  static async hasUserLiked<K extends keyof LikeableEntitiesMap>(
    userId: UUID,
    entityId: UUID,
    entity: K
  ): Promise<boolean> {
    try {
      const table = LIKE_TABLES[entity];
      if (!table) {
        throw new Error("Invalid entity type");
      }

      const res = await query(
        `SELECT 1 FROM ${table}
        WHERE user_id = $1 AND ${entity}_id = $2`,
        [userId, entityId]
      );
      return res.length > 0;
    } catch (error) {
      console.error("Error checking like status:", error);
      throw error;
    }
  }
}
