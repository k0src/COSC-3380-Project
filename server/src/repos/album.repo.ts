import {
  Album,
  UUID,
  AlbumSong,
  AlbumOptions,
  AccessContext,
  SongOptions,
} from "@types";
import { query, withTransaction } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { getAccessPredicate } from "@util";

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
      title,
      genre,
      release_date,
      image_url,
      image_url_blurhash,
      created_by,
      visibility_status,
    }: {
      title: string;
      genre: string;
      release_date?: string;
      image_url?: string;
      image_url_blurhash?: string;
      created_by: UUID;
      visibility_status: string;
    }
  ): Promise<Album | null> {
    try {
      if (
        title !== undefined &&
        (typeof title !== "string" || title.trim() === "")
      ) {
        throw new Error("Song title cannot be empty");
      }

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
      if (created_by !== undefined) {
        fields.push(`created_by = $${fields.length + 1}`);
        values.push(created_by);
      }
      if (visibility_status !== undefined) {
        fields.push(`visibility_status = $${fields.length + 1}`);
        values.push(visibility_status);
      }
      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(id);

      const res = await withTransaction(async (client) => {
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

  static async getOne(
    id: UUID,
    accessContext: AccessContext,
    options?: AlbumOptions
  ): Promise<Album | null> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "a");

      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const selectFields: string[] = ["a.*"];

      if (options?.includeArtist) {
        selectFields.push(`
        (
          SELECT row_to_json(artist_with_user)
          FROM (
            SELECT ar.*, row_to_json(u) AS user
            FROM artists ar
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE ar.id = a.created_by
          ) AS artist_with_user
        ) AS artist
      `);
      }

      if (options?.includeLikes) {
        selectFields.push(`
        (SELECT COUNT(*) FROM album_likes al WHERE al.album_id = a.id) AS likes
      `);
      }

      if (options?.includeRuntime) {
        selectFields.push(`
        (SELECT SUM(s2.duration)
         FROM songs s2
         JOIN album_songs als_runtime ON als_runtime.song_id = s2.id
         WHERE als_runtime.album_id = a.id
        ) AS runtime
      `);
      }

      if (options?.includeSongCount) {
        selectFields.push(`
        (SELECT COUNT(*) FROM album_songs als_count WHERE als_count.album_id = a.id) AS song_count
      `);
      }

      if (options?.includeSongIds) {
        selectFields.push(`
        (SELECT json_agg(als.song_id)
         FROM album_songs als
         WHERE als.album_id = a.id
        ) AS song_ids
      `);
      }

      const idIndex = predicateParams.length + 1;

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM albums a
        WHERE (${predicateSql}) AND a.id = $${idIndex}
        LIMIT 1
      `;

      const params = [...predicateParams, id];

      const res = await query(sql, params);
      if (!res || res.length === 0) {
        return null;
      }

      const album: Album = res[0];

      if (album.image_url) {
        album.image_url = getBlobUrl(album.image_url);
      }

      if (album.artist) {
        if (album.artist.user?.profile_picture_url) {
          album.artist.user.profile_picture_url = getBlobUrl(
            album.artist.user.profile_picture_url
          );
        }
        album.artist.type = "artist";
      }

      album.type = "album";
      return album;
    } catch (error) {
      console.error("Error fetching album:", error);
      throw error;
    }
  }

  static async getMany(
    accessContext: AccessContext,
    options?: AlbumOptions
  ): Promise<Album[]> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "a");
      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const orderByColumn = options?.orderByColumn ?? "created_at";
      const orderByDirection =
        (options?.orderByDirection ?? "DESC").toUpperCase() === "ASC"
          ? "ASC"
          : "DESC";

      const orderByMap: Record<string, string> = {
        title: "a.title",
        created_at: "a.created_at",
        release_date: "a.release_date",
        likes: "likes",
        runtime: "runtime",
        songCount: "song_count",
      };

      const sqlOrderByColumn = orderByMap[orderByColumn] ?? "a.created_at";

      const selectFields: string[] = ["a.*"];

      if (options?.includeArtist) {
        selectFields.push(`
        (
          SELECT row_to_json(artist_with_user)
          FROM (
            SELECT ar.*, row_to_json(u) AS user
            FROM artists ar
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE ar.id = a.created_by
          ) AS artist_with_user
        ) AS artist
      `);
      }

      if (options?.includeLikes) {
        selectFields.push(`
        (SELECT COUNT(*) FROM album_likes al WHERE al.album_id = a.id) AS likes
      `);
      }

      if (options?.includeRuntime) {
        selectFields.push(`
        (SELECT SUM(s2.duration)
         FROM songs s2
         JOIN album_songs als_rt ON als_rt.song_id = s2.id
         WHERE als_rt.album_id = a.id
        ) AS runtime
      `);
      }

      if (options?.includeSongCount) {
        selectFields.push(`
        (SELECT COUNT(*) FROM album_songs als_cnt WHERE als_cnt.album_id = a.id) AS song_count
      `);
      }

      if (options?.includeSongIds) {
        selectFields.push(`
        (SELECT json_agg(als.song_id)
         FROM album_songs als
         WHERE als.album_id = a.id
        ) AS song_ids
      `);
      }

      const limitIndex = predicateParams.length + 1;
      const offsetIndex = predicateParams.length + 2;

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM albums a
        WHERE (${predicateSql})
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const params = [...predicateParams, limit, offset];

      const rows = await query(sql, params);
      if (!rows || rows.length === 0) return [];

      return rows.map((album: Album) => {
        if (album.image_url) {
          album.image_url = getBlobUrl(album.image_url);
        }

        if (album.artist) {
          if (album.artist.user?.profile_picture_url) {
            album.artist.user.profile_picture_url = getBlobUrl(
              album.artist.user.profile_picture_url
            );
          }
          album.artist.type = "artist";
        }

        album.type = "album";
        return album;
      });
    } catch (error) {
      console.error("Error fetching albums:", error);
      throw error;
    }
  }

  static async addSong(albumId: UUID, songId: UUID, track_number: number) {
    try {
      await query(
        `INSERT INTO album_songs (album_id, song_id, track_number)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [albumId, songId, track_number]
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

  static async getSongs(
    albumId: UUID,
    accessContext: AccessContext,
    options?: SongOptions
  ): Promise<AlbumSong[]> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "s");

      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const selectFields: string[] = ["s.*"];

      if (options?.includeArtists) {
        selectFields.push(`
        (
          SELECT json_agg(row_to_json(ar_with_role))
          FROM (
            SELECT ar.*, sa.role, row_to_json(u) AS user
            FROM artists ar
            JOIN users u ON u.artist_id = ar.id
            JOIN song_artists sa ON sa.artist_id = ar.id
            WHERE sa.song_id = s.id
          ) AS ar_with_role
        ) AS artists
      `);
      }

      if (options?.includeLikes) {
        selectFields.push(
          `(SELECT COUNT(*) FROM song_likes sl WHERE sl.song_id = s.id) AS likes`
        );
      }

      const idIndex = predicateParams.length + 1;
      const limitIndex = predicateParams.length + 2;
      const offsetIndex = predicateParams.length + 3;

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM songs s
        JOIN album_songs als ON s.id = als.song_id
        WHERE (${predicateSql}) AND als.album_id = $${idIndex}
        ORDER BY als.track_number ASC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const params = [...predicateParams, albumId, limit, offset];

      const songs = await query(sql, params);
      if (!songs || songs.length === 0) return [];

      return songs.map((song: AlbumSong) => {
        if (song.image_url) song.image_url = getBlobUrl(song.image_url);
        if (song.audio_url) song.audio_url = getBlobUrl(song.audio_url);

        if (song.artists?.length) {
          song.artists.forEach((artist) => {
            if (artist.user?.profile_picture_url) {
              artist.user.profile_picture_url = getBlobUrl(
                artist.user.profile_picture_url
              );
            }
            artist.type = "artist";
          });
        }

        song.type = "song";
        return song;
      });
    } catch (error) {
      console.error("Error fetching album songs:", error);
      throw error;
    }
  }

  static async count(): Promise<number> {
    try {
      const res = await query("SELECT COUNT(*) FROM albums");
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting albums:", error);
      throw error;
    }
  }

  static async getRelatedAlbums(
    albumId: UUID,
    options?: AlbumOptions
  ): Promise<Album[]> {
    try {
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;

      const albums = await query(
        "SELECT * FROM get_related_albums($1, $2, $3, $4, $5, $6, $7)",
        [
          albumId,
          options?.includeArtist ?? false,
          options?.includeLikes ?? false,
          options?.includeSongCount ?? false,
          options?.includeRuntime ?? false,
          limit,
          offset,
        ]
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
