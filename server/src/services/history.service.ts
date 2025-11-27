import type { UUID, Song, Album, Playlist, Artist } from "@types";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage";
import { isDeleted, notDeletedCondition } from "@util";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

type HistoryEntity = "song" | "album" | "playlist" | "artist";

type HistoryEntityMap = {
  song: Song;
  album: Album;
  playlist: Playlist;
  artist: Artist;
};

const HISTORY_TABLES: Record<HistoryEntity, string> = {
  song: "song_history",
  album: "album_history",
  playlist: "playlist_history",
  artist: "artist_history",
};

export default class HistoryService {
  static async getSongHistory(
    userId: UUID,
    options?: {
      timeRange?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Song[]> {
    try {
      const { timeRange, limit = 50, offset = 0 } = options || {};

      const timeRangeFilter = timeRange
        ? `AND sh.played_at >= NOW() - INTERVAL '${timeRange}'`
        : "";

      const sql = `
        SELECT DISTINCT ON (s.id) 
          s.*,
          sh.played_at,
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'title', a.title,
                'image_url', a.image_url,
                'image_url_blurhash', a.image_url_blurhash,
                'owner_id', a.owner_id,
                'visibility_status', a.visibility_status,
                'release_date', a.release_date,
                'genre', a.genre,
                'created_at', a.created_at,
                'updated_at', a.updated_at,
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
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar_album ON ar_album.id = a.created_by
            WHERE als.song_id = s.id
              AND ${notDeletedCondition("album", "a")}
              AND (a.visibility_status = 'PUBLIC' OR a.owner_id = '${userId}')
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
              AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
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
        JOIN song_history sh ON sh.song_id = s.id
        WHERE sh.user_id = $1
          AND ${notDeletedCondition("song", "s")}
          AND (s.visibility_status = 'PUBLIC' OR s.owner_id = '${userId}')
          ${timeRangeFilter}
        ORDER BY s.id, sh.played_at DESC
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
      console.error("Error fetching song history:", error);
      throw error;
    }
  }

  static async getPlaylistHistory(
    userId: UUID,
    options?: {
      timeRange?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Playlist[]> {
    try {
      const { timeRange, limit = 50, offset = 0 } = options || {};

      const timeRangeFilter = timeRange
        ? `AND ph.played_at >= NOW() - INTERVAL '${timeRange}'`
        : "";

      const sql = `
        SELECT DISTINCT ON (p.id)
          p.*,
          ph.played_at,
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
                AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
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
        JOIN playlist_history ph ON ph.playlist_id = p.id
        WHERE ph.user_id = $1
          AND ${notDeletedCondition("playlist", "p")}
          AND (p.visibility_status = 'PUBLIC' OR p.owner_id = '${userId}')
          ${timeRangeFilter}
        ORDER BY p.id, ph.played_at DESC
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
      console.error("Error fetching playlist history:", error);
      throw error;
    }
  }

  static async getArtistHistory(
    userId: UUID,
    options?: {
      timeRange?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Artist[]> {
    try {
      const { timeRange, limit = 50, offset = 0 } = options || {};

      const timeRangeFilter = timeRange
        ? `AND arh.played_at >= NOW() - INTERVAL '${timeRange}'`
        : "";

      const sql = `
        SELECT DISTINCT ON (ar.id)
          ar.*,
          arh.played_at,
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
              WHERE u.id = ar.user_id
                AND ${notDeletedCondition("user", "u")}
                AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
            ) AS user_data
          ) AS user
        FROM artists ar
        JOIN artist_history arh ON arh.artist_id = ar.id
        WHERE arh.user_id = $1
          AND ${notDeletedCondition("artist", "ar")}
          ${timeRangeFilter}
        ORDER BY ar.id, arh.played_at DESC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [userId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const artists: Artist[] = res.map((artist) => {
        if (artist.banner_image_url) {
          artist.banner_image_url = getBlobUrl(artist.banner_image_url);
        }

        if (artist.user?.profile_picture_url) {
          artist.user.profile_picture_url = getBlobUrl(
            artist.user.profile_picture_url
          );
        }

        artist.type = "artist";
        return artist;
      });

      return artists;
    } catch (error) {
      console.error("Error fetching artist history:", error);
      throw error;
    }
  }

  static async getAlbumHistory(
    userId: UUID,
    options?: {
      timeRange?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Album[]> {
    try {
      const { timeRange, limit = 50, offset = 0 } = options || {};

      const timeRangeFilter = timeRange
        ? `AND ah.played_at >= NOW() - INTERVAL '${timeRange}'`
        : "";

      const sql = `
        SELECT DISTINCT ON (a.id) 
          a.*,
          ah.played_at,
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
                )} AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))))
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
        JOIN album_history ah ON ah.album_id = a.id
        WHERE ah.user_id = $1
          AND ${notDeletedCondition("album", "a")}
          AND (a.visibility_status = 'PUBLIC' OR a.owner_id = '${userId}')
          ${timeRangeFilter}
        ORDER BY a.id, ah.played_at DESC
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
      console.error("Error fetching album history:", error);
      throw error;
    }
  }

  static async addToHistory<K extends keyof HistoryEntityMap>(
    userId: UUID,
    entityId: UUID,
    entity: K
  ) {
    try {
      const userDeleted = await isDeleted(userId, "user");
      if (userDeleted) {
        throw new Error("User is deleted");
      }

      const entityDeleted = await isDeleted(entityId, entity);
      if (entityDeleted) {
        throw new Error(`${entity} is deleted`);
      }

      const table = HISTORY_TABLES[entity];
      if (!table) {
        throw new Error("Invalid entity type");
      }

      await query(
        `INSERT INTO ${table} (user_id, ${entity}_id) VALUES ($1, $2)`,
        [userId, entityId]
      );

      if (entity === "song") {
        await this.addRelatedEntitiesForSong(userId, entityId);
      }
    } catch (error) {
      console.error("Error adding to history:", error);
      throw error;
    }
  }

  private static async addRelatedEntitiesForSong(
    userId: UUID,
    songId: UUID
  ): Promise<void> {
    try {
      const albumResult = await query(
        `SELECT album_id 
        FROM album_songs 
        WHERE song_id = $1
          AND NOT EXISTS (
            SELECT 1 FROM deleted_albums da
            WHERE da.album_id = album_songs.album_id
          )
        LIMIT 1`,
        [songId]
      );

      if (albumResult.length > 0) {
        const albumId = albumResult[0].album_id;
        await query(
          `INSERT INTO album_history (user_id, album_id) VALUES ($1, $2)`,
          [userId, albumId]
        );
      }

      const artistsResult = await query(
        `SELECT artist_id FROM song_artists 
        WHERE song_id = $1
          AND NOT EXISTS (
            SELECT 1 FROM deleted_artists da
            WHERE da.artist_id = song_artists.artist_id
          )`,
        [songId]
      );

      for (const artist of artistsResult) {
        await query(
          `INSERT INTO artist_history (user_id, artist_id) VALUES ($1, $2)`,
          [userId, artist.artist_id]
        );
      }
    } catch (error) {
      console.error("Error adding related entities to history:", error);
    }
  }

  static async clearHistory(userId: UUID): Promise<void> {
    try {
      await query("DELETE FROM song_history WHERE user_id = $1", [userId]);
      await query("DELETE FROM album_history WHERE user_id = $1", [userId]);
      await query("DELETE FROM playlist_history WHERE user_id = $1", [userId]);
      await query("DELETE FROM artist_history WHERE user_id = $1", [userId]);
    } catch (error) {
      console.error("Error clearing history:", error);
      throw error;
    }
  }

  static async checkUserHasSongHistory(userId: UUID): Promise<boolean> {
    try {
      const result = await query(
        `SELECT EXISTS (
          SELECT 1 FROM song_history
          WHERE user_id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_songs
              WHERE deleted_songs.song_id = song_history.song_id
            )
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users
              WHERE deleted_users.user_id = song_history.user_id
            )
        ) AS has_song_history`,
        [userId]
      );
      return result[0]?.has_song_history || false;
    } catch (error) {
      console.error("Error checking user song history:", error);
      throw error;
    }
  }
}
