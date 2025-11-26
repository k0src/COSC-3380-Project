import type {
  UUID,
  Song,
  Album,
  Playlist,
  User,
  Comment,
  AccessContext,
  SongOrderByColumn,
  AlbumOrderByColumn,
  PlaylistOrderByColumn,
  OrderByDirection,
} from "@types";
import {
  notDeletedCondition,
  getUserVisibilityCondition,
  getVisibilityCondition,
} from "@util";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

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

  static async getLikedSongs(
    userId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: SongOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Song[]> {
    try {
      const songVisibility = getVisibilityCondition(
        "s",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const albumVisibility = getVisibilityCondition(
        "al",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "created_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<SongOrderByColumn, string> = {
        title: "s.title",
        created_at: "s.created_at",
        streams: "s.streams",
        release_date: "s.release_date",
        likes: "likes",
        comments: "comments",
        duration: "s.duration",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          s.*,
          (
            SELECT json_agg(
              json_build_object(
                'id', al.id,
                'title', al.title,
                'image_url', al.image_url,
                'image_url_blurhash', al.image_url_blurhash,
                'owner_id', al.owner_id,
                'visibility_status', al.visibility_status,
                'release_date', al.release_date,
                'genre', al.genre,
                'created_at', al.created_at,
                'updated_at', al.updated_at,
                'type', 'album',
                'artist', json_build_object(
                  'id', ar_album.id,
                  'display_name', ar_album.display_name,
                  'bio', ar_album.bio,
                  'user_id', ar_album.user_id,
                  'verified', ar_album.verified,
                  'location', ar_album.location,
                  'banner_image_url', ar_album.banner_image_url,
                  'banner_image_url_blurhash', ar_album.banner_image_url_blurhash,
                  'created_at', ar_album.created_at,
                  'updated_at', ar_album.updated_at,
                  'type', 'artist'
                )
              )
            )
            FROM albums al
            JOIN album_songs als ON als.album_id = al.id
            LEFT JOIN artists ar_album ON ar_album.id = al.created_by
            WHERE als.song_id = s.id
              AND ${notDeletedCondition("album", "al")}
              AND ${albumVisibility}
              AND (ar_album.id IS NULL OR ${notDeletedCondition(
                "artist",
                "ar_album"
              )})
          ) AS albums,
          (
            SELECT json_agg(
              json_build_object(
                'id', ar.id,
                'display_name', ar.display_name,
                'bio', ar.bio,
                'user_id', ar.user_id,
                'verified', ar.verified,
                'location', ar.location,
                'banner_image_url', ar.banner_image_url,
                'banner_image_url_blurhash', ar.banner_image_url_blurhash,
                'created_at', ar.created_at,
                'updated_at', ar.updated_at,
                'role', sa.role,
                'type', 'artist',
                'user', json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'email', u.email,
                  'profile_picture_url', u.profile_picture_url,
                  'pfp_blurhash', u.pfp_blurhash,
                  'role', u.role,
                  'is_private', u.is_private,
                  'status', u.status,
                  'artist_id', u.artist_id,
                  'created_at', u.created_at,
                  'updated_at', u.updated_at
                )
              )
            )
            FROM song_artists sa
            JOIN artists ar ON ar.id = sa.artist_id
            JOIN users u ON u.id = ar.user_id
            WHERE sa.song_id = s.id
              AND ${notDeletedCondition("artist", "ar")}
              AND ${notDeletedCondition("user", "u")}
              AND ${userVisibility}
          ) AS artists,
          (
            SELECT COUNT(*)
            FROM song_likes sl
            WHERE sl.song_id = s.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM comments c
            WHERE c.song_id = s.id
              AND ${notDeletedCondition("comment", "c")}
          ) AS comments,
          EXISTS (
            SELECT 1 
            FROM trending_songs ts 
            WHERE ts.song_id = s.id
          ) AS is_trending
        FROM songs s
        JOIN song_likes sl ON sl.song_id = s.id
        WHERE sl.user_id = $1
          AND ${notDeletedCondition("song", "s")}
          AND ${songVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [userId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const songs: Song[] = res.map((song: Song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }

        if (song.albums?.length) {
          song.albums.forEach((album) => {
            if (album.image_url) {
              album.image_url = getBlobUrl(album.image_url);
            }
            if (album.artist?.banner_image_url) {
              album.artist.banner_image_url = getBlobUrl(
                album.artist.banner_image_url
              );
            }
          });
        }

        if (song.artists?.length) {
          song.artists.forEach((artist) => {
            if (artist.banner_image_url) {
              artist.banner_image_url = getBlobUrl(artist.banner_image_url);
            }
            if (artist.user?.profile_picture_url) {
              artist.user.profile_picture_url = getBlobUrl(
                artist.user.profile_picture_url
              );
            }
          });
        }

        song.type = "song";
        return song;
      });

      return songs;
    } catch (error) {
      console.error("Error fetching liked songs:", error);
      throw error;
    }
  }

  static async getLikedAlbums(
    userId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: AlbumOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Album[]> {
    try {
      const albumVisibility = getVisibilityCondition(
        "a",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "created_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<AlbumOrderByColumn, string> = {
        title: "a.title",
        created_at: "a.created_at",
        release_date: "a.release_date",
        likes: "likes",
        song_count: "song_count",
        runtime: "runtime",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          a.*,
          (
            SELECT row_to_json(artist_with_user)
            FROM (
              SELECT 
                ar.id,
                ar.display_name,
                ar.bio,
                ar.user_id,
                ar.verified,
                ar.location,
                ar.banner_image_url,
                ar.banner_image_url_blurhash,
                ar.created_at,
                ar.updated_at,
                'artist' AS type,
                row_to_json(u.*) AS user
              FROM artists ar
              LEFT JOIN users u ON u.id = ar.user_id
              WHERE ar.id = a.created_by
                AND ${notDeletedCondition("artist", "ar")}
                AND (u.id IS NULL OR (${notDeletedCondition(
                  "user",
                  "u"
                )} AND ${userVisibility}))
            ) AS artist_with_user
          ) AS artist,
          (
            SELECT COUNT(*)
            FROM album_likes al
            WHERE al.album_id = a.id
          ) AS likes,
          (
            SELECT SUM(s.duration)
            FROM songs s
            JOIN album_songs als ON als.song_id = s.id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT COUNT(*)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT json_agg(als.song_id)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids
          
        FROM albums a
        JOIN album_likes al ON al.album_id = a.id
        WHERE al.user_id = $1
          AND ${notDeletedCondition("album", "a")}
          AND ${albumVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [userId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const albums: Album[] = res.map((album) => {
        if (album.image_url) {
          album.image_url = getBlobUrl(album.image_url);
        }

        if (album.artist) {
          if (album.artist.banner_image_url) {
            album.artist.banner_image_url = getBlobUrl(
              album.artist.banner_image_url
            );
          }
          if (album.artist.user?.profile_picture_url) {
            album.artist.user.profile_picture_url = getBlobUrl(
              album.artist.user.profile_picture_url
            );
          }
        }

        album.type = "album";
        return album;
      });

      return albums;
    } catch (error) {
      console.error("Error fetching liked albums:", error);
      throw error;
    }
  }

  static async getLikedPlaylists(
    userId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: PlaylistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Playlist[]> {
    try {
      const playlistVisibility = getVisibilityCondition(
        "p",
        "visibility_status",
        "owner_id",
        accessContext
      );

      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "created_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<PlaylistOrderByColumn, string> = {
        title: "p.title",
        created_at: "p.created_at",
        likes: "likes",
        runtime: "runtime",
        song_count: "song_count",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          p.*,
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
                AND ${userVisibility}
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
        JOIN playlist_likes pl ON pl.playlist_id = p.id
        WHERE pl.user_id = $1
          AND ${notDeletedCondition("playlist", "p")}
          AND ${playlistVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [userId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const playlists: Playlist[] = res.map((playlist) => {
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
      });

      return playlists;
    } catch (error) {
      console.error("Error fetching liked playlists:", error);
      throw error;
    }
  }
}
