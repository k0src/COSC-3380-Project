import type {
  UUID,
  Song,
  Album,
  Playlist,
  User,
  Comment,
  AccessContext,
} from "@types";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { getAccessPredicate } from "@util";

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

const DELETED_MAP: Record<LikeableEntity, string> = {
  song: "deleted_songs",
  album: "deleted_albums",
  playlist: "deleted_playlists",
  comment: "deleted_comments",
};

export default class LikeService {
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
        `SELECT COUNT(*) FROM ${table} WHERE ${entity}_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM ${DELETED_MAP[entity]} de
          WHERE de.${entity}_id = $1
        )`,
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
    accessContext: AccessContext,
    options?: { limit?: number; offset?: number; [key: string]: any }
  ): Promise<LikeableEntitiesMap[K][]> {
    const likeTable = LIKE_TABLES[entity];

    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    let sql = "";
    let params: any[] = [];

    switch (entity) {
      case "song": {
        const { sql: predicateSqlRaw, params: predicateParams } =
          getAccessPredicate(accessContext, "s", 2);
        const predicateSql =
          (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

        const baseParamCount = 1 + predicateParams.length;
        const includeAlbumsIndex = baseParamCount + 1;
        const includeArtistsIndex = baseParamCount + 2;
        const includeLikesIndex = baseParamCount + 3;
        const includeCommentsIndex = baseParamCount + 4;
        const limitIndex = baseParamCount + 5;
        const offsetIndex = baseParamCount + 6;

        sql = `
          SELECT s.*,
            CASE WHEN $${includeAlbumsIndex} THEN
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
            CASE WHEN $${includeArtistsIndex} THEN
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
            CASE WHEN $${includeLikesIndex} THEN
              (SELECT COUNT(*) FROM song_likes sl
              WHERE sl.song_id = s.id)
            ELSE NULL END AS likes,
            CASE WHEN $${includeCommentsIndex} THEN
              (SELECT COUNT(*) FROM comments c
              WHERE c.song_id = s.id)
            ELSE NULL END AS comments
          FROM songs s
          JOIN ${likeTable} l ON s.id = l.song_id
          WHERE l.user_id = $1 AND (${predicateSql})
          LIMIT $${limitIndex} OFFSET $${offsetIndex}
        `;
        params = [
          userId,
          ...predicateParams,
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
        const { sql: predicateSqlRaw, params: predicateParams } =
          getAccessPredicate(accessContext, "a", 2);
        const predicateSql =
          (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

        const baseParamCount = 1 + predicateParams.length;
        const includeArtistIndex = baseParamCount + 1;
        const includeLikesIndex = baseParamCount + 2;
        const includeRuntimeIndex = baseParamCount + 3;
        const includeSongCountIndex = baseParamCount + 4;
        const limitIndex = baseParamCount + 5;
        const offsetIndex = baseParamCount + 6;

        sql = `
          SELECT a.*,
          CASE WHEN $${includeArtistIndex} THEN 
            (SELECT row_to_json(artist_with_user)
            FROM (
              SELECT ar.*,
                row_to_json(u) AS user
              FROM artists ar
              LEFT JOIN users u ON ar.user_id = u.id
              WHERE ar.id = a.created_by
            ) AS artist_with_user)
          ELSE NULL END as artist,
          CASE WHEN $${includeLikesIndex} THEN (SELECT COUNT(*) FROM album_likes al 
            WHERE al.album_id = a.id) 
          ELSE NULL END as likes,
          CASE WHEN $${includeRuntimeIndex} THEN (SELECT SUM(s.duration) FROM songs s 
            JOIN album_songs als ON s.id = als.song_id 
            WHERE als.album_id = a.id) 
          ELSE NULL END as runtime,
          CASE WHEN $${includeSongCountIndex} THEN (SELECT COUNT(*) FROM album_songs als 
            WHERE als.album_id = a.id)
          ELSE NULL END as song_count
          FROM albums a
          JOIN ${likeTable} l ON a.id = l.album_id
          WHERE l.user_id = $1 AND (${predicateSql})
          LIMIT $${limitIndex} OFFSET $${offsetIndex}
        `;
        params = [
          userId,
          ...predicateParams,
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
        const { sql: predicateSqlRaw, params: predicateParams } =
          getAccessPredicate(accessContext, "p", 2);
        const predicateSql =
          (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

        const baseParamCount = 1 + predicateParams.length;
        const includeUserIndex = baseParamCount + 1;
        const includeLikesIndex = baseParamCount + 2;
        const includeSongCountIndex = baseParamCount + 3;
        const includeRuntimeIndex = baseParamCount + 4;
        const limitIndex = baseParamCount + 5;
        const offsetIndex = baseParamCount + 6;

        sql = `
          SELECT p.*,
          CASE WHEN $${includeUserIndex} THEN row_to_json(u.*)
          ELSE NULL END as user,
          CASE WHEN $${includeLikesIndex} THEN (SELECT COUNT(*) FROM playlist_likes pl
            WHERE pl.playlist_id = p.id)
          ELSE NULL END as likes,
          CASE WHEN $${includeSongCountIndex} THEN (SELECT COUNT(*) FROM playlist_songs ps
            WHERE ps.playlist_id = p.id)
          ELSE NULL END as song_count,
          CASE WHEN $${includeRuntimeIndex} THEN (SELECT COALESCE(SUM(s.duration), 0) FROM songs s
            JOIN playlist_songs ps ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id)
          ELSE NULL END as runtime
          FROM playlists p
          LEFT JOIN users u ON p.owner_id = u.id
          JOIN ${likeTable} l ON p.id = l.playlist_id
          WHERE l.user_id = $1 AND (${predicateSql})
          LIMIT $${limitIndex} OFFSET $${offsetIndex}
        `;
        params = [
          userId,
          ...predicateParams,
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
        const baseParamCount = 1;
        const limitIndex = baseParamCount + 1;
        const offsetIndex = baseParamCount + 2;

        sql = `
          SELECT c.*
          FROM comments c
          JOIN ${likeTable} l ON c.id = l.comment_id
          WHERE l.user_id = $1
          LIMIT $${limitIndex} OFFSET $${offsetIndex}
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

  static async getLikedCount<K extends keyof LikeableEntitiesMap>(
    userId: UUID,
    entity: K
  ): Promise<number> {
    const likeTable = LIKE_TABLES[entity];

    const res = await query(
      `SELECT COUNT(*) FROM ${likeTable}
      WHERE user_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM ${DELETED_MAP[entity]} de
        WHERE de.${entity}_id = ${likeTable}.${entity}_id
      )`,
      [userId]
    );

    return parseInt(res[0]?.count ?? "0", 10);
  }

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
      AND NOT EXISTS (
        SELECT 1 FROM deleted_users du WHERE du.user_id = u.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM ${DELETED_MAP[entity]} de
        WHERE de.${entity}_id = l.${entity}_id
      )
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
        WHERE user_id = $1 AND ${entity}_id = $2
        AND NOT EXISTS (
          SELECT 1 FROM ${DELETED_MAP[entity]} de
          WHERE de.${entity}_id = $2
        )`,
        [userId, entityId]
      );
      return res.length > 0;
    } catch (error) {
      console.error("Error checking like status:", error);
      throw error;
    }
  }
}
