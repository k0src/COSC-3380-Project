import {
  Album,
  UUID,
  AlbumSong,
  AccessContext,
  AlbumOrderByColumn,
  OrderByDirection,
  SongOrderByColumn,
} from "@types";
import { query, withTransaction } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import {
  getVisibilityCondition,
  getUserVisibilityCondition,
  notDeletedCondition,
  isDeleted,
} from "@util";

export default class AlbumRepository {
  static async create({
    title,
    owner_id,
    genre,
    release_date,
    image_url,
    image_url_blurhash,
    created_by,
    visibility_status,
  }: {
    title: string;
    owner_id: UUID;
    genre: string;
    release_date?: string;
    image_url?: string;
    image_url_blurhash?: string;
    created_by: UUID;
    visibility_status: string;
  }): Promise<Album | null> {
    try {
      if (!owner_id) {
        throw new Error("Owner ID is required");
      }
      const ownerDeleted = await isDeleted(owner_id, "user");
      if (ownerDeleted) {
        throw new Error("Cannot create album for a deleted user.");
      }

      if (!created_by) {
        throw new Error("Created by is required");
      }
      const artistDeleted = await isDeleted(created_by, "artist");
      if (artistDeleted) {
        throw new Error("Cannot create album by a deleted artist.");
      }

      if (!title || typeof title !== "string" || title.trim() === "") {
        throw new Error("Song title cannot be empty");
      }
      if (!release_date) {
        release_date = new Date().toISOString().split("T")[0];
      }

      const res = await withTransaction(async (client) => {
        const insert = await client.query(
          `INSERT INTO albums (
            title,
            owner_id,
            genre,
            release_date,
            image_url,
            image_url_blurhash,
            created_by,
            visibility_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            title,
            owner_id,
            genre,
            release_date,
            image_url,
            image_url_blurhash,
            created_by,
            visibility_status,
          ]
        );
        return insert.rows[0] ?? null;
      });

      if (res) {
        if (res.image_url) {
          res.image_url = getBlobUrl(res.image_url);
        }
        res.type = "album";
      }

      return res;
    } catch (error) {
      console.error("Error creating album:", error);
      throw error;
    }
  }

  static async update(
    id: UUID,
    {
      owner_id,
      title,
      genre,
      release_date,
      image_url,
      image_url_blurhash,
      visibility_status,
    }: {
      owner_id: UUID;
      title: string;
      genre: string;
      release_date?: string;
      image_url?: string;
      image_url_blurhash?: string;
      visibility_status: string;
    }
  ): Promise<Album | null> {
    try {
      if (!owner_id) {
        throw new Error("Owner ID is required");
      }
      const ownerDeleted = await isDeleted(owner_id, "user");
      if (ownerDeleted) {
        throw new Error("Cannot update album for a deleted user.");
      }

      const albumDeleted = await isDeleted(id, "album");
      if (albumDeleted) {
        throw new Error("Cannot update a deleted album.");
      }

      if (
        title !== undefined &&
        (typeof title !== "string" || title.trim() === "")
      ) {
        throw new Error("Album title cannot be empty");
      }

      const res = await withTransaction(async (client) => {
        const fields: string[] = [];
        const values: any[] = [];

        if (title !== undefined) {
          fields.push(`title = $${fields.length + 1}`);
          values.push(title);
        }
        if (genre !== undefined) {
          fields.push(`genre = $${fields.length + 1}`);
          values.push(genre);
        }
        if (release_date !== undefined) {
          fields.push(`release_date = $${fields.length + 1}`);
          values.push(release_date);
        }
        if (image_url !== undefined) {
          fields.push(`image_url = $${fields.length + 1}`);
          values.push(image_url);
        }
        if (image_url_blurhash !== undefined) {
          fields.push(`image_url_blurhash = $${fields.length + 1}`);
          values.push(image_url_blurhash);
        }
        if (visibility_status !== undefined) {
          fields.push(`visibility_status = $${fields.length + 1}`);
          values.push(visibility_status);
        }
        if (fields.length === 0) {
          throw new Error("No fields to update");
        }

        values.push(id);

        const sql = `UPDATE albums SET ${fields.join(", ")} WHERE id = $${
          values.length
        } RETURNING *`;
        const res = await client.query(sql, values);
        return res.rows[0] ?? null;
      });

      if (res) {
        if (res.image_url) {
          res.image_url = getBlobUrl(res.image_url);
        }
        res.type = "album";
      }

      return res;
    } catch (error) {
      console.error("Error updating album:", error);
      throw error;
    }
  }

  static async delete(id: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO deleted_albums 
          (album_id, deleted_at) VALUES ($1, NOW())`,
          [id]
        );
      });
    } catch (error) {
      console.error("Error deleting album:", error);
      throw error;
    }
  }

  static async bulkDelete(albumIds: UUID[]) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO deleted_albums
          (album_id, deleted_at)
          SELECT id, NOW() FROM albums WHERE id = ANY($1)`,
          [albumIds]
        );
      });
    } catch (error) {
      console.error("Error bulk deleting albums:", error);
      throw error;
    }
  }

  static async getAlbumDetails(
    id: UUID,
    accessContext: AccessContext
  ): Promise<Album | null> {
    try {
      const albumVisibility = getVisibilityCondition(
        "a",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

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
        WHERE a.id = $1
          AND ${notDeletedCondition("album", "a")}
          AND ${albumVisibility}
        LIMIT 1
      `;

      const res = await query(sql, [id]);

      if (!res || res.length === 0) {
        return null;
      }

      const album: Album = res[0];

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
    } catch (error) {
      console.error("Error fetching album details:", error);
      throw error;
    }
  }

  static async getManyAlbums(
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
        WHERE ${notDeletedCondition("album", "a")}
          AND ${albumVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $1 OFFSET $2
      `;

      const res = await query(sql, [limit, offset]);

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
      console.error("Error fetching albums:", error);
      throw error;
    }
  }

  static async getSongs(
    albumId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: SongOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<AlbumSong[]> {
    try {
      const songVisibility = getVisibilityCondition(
        "s",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "als.track_number";
      const orderByDirection = options?.orderByDirection || "ASC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<SongOrderByColumn | "als.track_number", string> =
        {
          title: "s.title",
          created_at: "s.created_at",
          streams: "s.streams",
          release_date: "s.release_date",
          likes: "likes",
          comments: "comments",
          duration: "s.duration",
          "als.track_number": "als.track_number",
        };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          s.*,
          als.track_number,
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
        JOIN album_songs als ON s.id = als.song_id
        WHERE als.album_id = $1
          AND ${notDeletedCondition("song", "s")}
          AND ${songVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [albumId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const songs: AlbumSong[] = res.map((song: AlbumSong) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
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
      console.error("Error fetching album songs:", error);
      throw error;
    }
  }

  static async addSong(albumId: UUID, songId: UUID) {
    try {
      const albumDeleted = await isDeleted(albumId, "album");
      if (albumDeleted) {
        throw new Error("Cannot add song to a deleted album.");
      }

      const songDeleted = await isDeleted(songId, "song");
      if (songDeleted) {
        throw new Error("Cannot add a deleted song to an album.");
      }

      const maxTrackNumberRes = await query(
        `SELECT COALESCE(MAX(track_number), 0) AS max_track_number
        FROM album_songs
        WHERE album_id = $1`,
        [albumId]
      );

      const nextTrackNumber =
        maxTrackNumberRes[0]?.max_track_number !== undefined
          ? maxTrackNumberRes[0].max_track_number + 1
          : 1;

      await query(
        `INSERT INTO album_songs (album_id, song_id, track_number)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [albumId, songId, nextTrackNumber]
      );
    } catch (error) {
      console.error("Error adding song:", error);
      throw error;
    }
  }

  static async removeSong(albumId: UUID, songId: UUID) {
    try {
      await query(
        `DELETE FROM album_songs
        WHERE album_id = $1 AND song_id = $2`,
        [albumId, songId]
      );
    } catch (error) {
      console.error("Error removing song:", error);
      throw error;
    }
  }

  static async getRelatedAlbums(
    albumId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Album[]> {
    try {
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;

      const albums = await query(
        "SELECT * FROM get_related_albums($1, $2, $3, $4, $5, $6, $7)",
        [albumId, true, true, true, true, limit, offset]
      );

      if (!albums || albums.length === 0) {
        return [];
      }

      const processedAlbums = await Promise.all(
        albums.map(async (album: Album) => {
          if (album.image_url) {
            album.image_url = getBlobUrl(album.image_url);
          }
          if (album.artist) {
            if (album.artist.user && album.artist.user.profile_picture_url) {
              album.artist.user.profile_picture_url = getBlobUrl(
                album.artist.user.profile_picture_url
              );
            }
            album.artist.type = "artist";
          }
          album.type = "album";
          return album;
        })
      );

      return processedAlbums;
    } catch (error) {
      console.error("Error fetching related albums:", error);
      throw error;
    }
  }
}
