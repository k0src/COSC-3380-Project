import { Album, UUID, Song } from "@types";
import { query, withTransaction } from "../config/database.js";
import { getBlobUrl } from "config/blobStorage.js";
import { validateAlbumId, validateMany } from "@validators";

export default class AlbumRepository {
  /**
   * Creates a new album.
   * @param albumData - The data for the new album.
   * @param album.title - The title of the album.
   * @param album.release_date - The release date of the album (optional).
   * @param album.image_url - The image URL of the album (optional).
   * @param album.created_by - The ID of the user who created the album.
   * @returns The created album, or null if creation fails.
   * @throws Error if the operation fails.
   */
  static async create({
    title,
    release_date,
    image_url,
    created_by,
  }: {
    title: string;
    release_date?: number;
    image_url?: string;
    created_by: UUID;
  }): Promise<Album | null> {
    try {
      const res = await query(
        `INSERT INTO albums (title, release_date, image_url, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [title, release_date, image_url, created_by]
      );
      return res[0] ?? null;
    } catch (error) {
      console.error("Error creating album:", error);
      throw error;
    }
  }

  /**
   * Updates an album.
   * @param id - The ID of the album to update.
   * @param albumData - The new data for the album.
   * @param album.title - The new title of the album (optional).
   * @param album.release_date - The new release date of the album (optional).
   * @param album.image_url - The new image URL of the album (optional).
   * @param album.created_by - The new user ID of the album artist (optional).
   * @returns The updated album, or null if the update fails.
   * @throws Error if the operation fails.
   */
  static async update(
    id: UUID,
    {
      title,
      release_date,
      image_url,
      created_by,
    }: {
      title?: string;
      release_date?: number;
      image_url?: string;
      created_by?: UUID;
    }
  ): Promise<Album | null> {
    try {
      if (!(await validateAlbumId(id))) {
        throw new Error("Invalid album ID");
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (title !== undefined) {
        fields.push(`title = $${fields.length + 1}`);
        values.push(title);
      }
      if (release_date !== undefined) {
        fields.push(`release_date = $${fields.length + 1}`);
        values.push(release_date);
      }
      if (image_url !== undefined) {
        fields.push(`image_url = $${fields.length + 1}`);
        values.push(image_url);
      }
      if (created_by !== undefined) {
        fields.push(`created_by = $${fields.length + 1}`);
        values.push(created_by);
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

      return res;
    } catch (error) {
      console.error("Error updating album:", error);
      throw error;
    }
  }

  /**
   * Deletes an album.
   * @param id - The ID of the album to delete.
   * @returns The deleted album, or null if the deletion fails.
   * @throws Error if the operation fails.
   */
  static async delete(id: UUID): Promise<Album | null> {
    try {
      if (!(await validateAlbumId(id))) {
        throw new Error("Invalid album ID");
      }

      const res = await withTransaction(async (client) => {
        const del = await client.query(
          "DELETE FROM albums WHERE id = $1 RETURNING *",
          [id]
        );
        return del.rows[0] ?? null;
      });

      return res;
    } catch (error) {
      console.error("Error deleting album:", error);
      throw error;
    }
  }

  /**
   * Gets a single album by ID.
   * @param id - The ID of the album to get.
   * @param options - Options for including related data.
   * @param options.includeArtist - Option to include the artist data.
   * @param options.includeLikes - Option to include the like count.
   * @param options.includeRuntime - Option to include the total runtime of the album.
   * @returns The album, or null if not found.
   * @throws Error if the operation fails.
   */
  static async getOne(
    id: UUID,
    options?: {
      includeArtist?: boolean;
      includeLikes?: boolean;
      includeRuntime?: boolean;
    }
  ): Promise<Album | null> {
    try {
      if (!(await validateAlbumId(id))) {
        throw new Error("Invalid album ID");
      }

      const sql = `
        SELECT
          a.*,
        CASE WHEN $1 THEN row_to_json(ar.*)
        ELSE NULL END as artist,
        CASE WHEN $2 THEN (SELECT COUNT(*) FROM album_likes al
          WHERE al.album_id = a.id)
        ELSE NULL END as likes,
        CASE WHEN $3 THEN (SELECT SUM(s.duration) FROM songs s
          JOIN album_songs als ON s.id = als.song_id WHERE als.album_id = a.id)
        ELSE NULL END as runtime
        FROM albums a
        LEFT JOIN artists ar ON a.created_by = ar.id
        WHERE a.id = $4
        LIMIT 1
      `;

      const params = [
        options?.includeArtist ?? false,
        options?.includeLikes ?? false,
        options?.includeRuntime ?? false,
        id,
      ];

      const res = await query(sql, params);
      if (!res || res.length === 0) {
        return null;
      }

      const album: Album = res[0];
      if (album.image_url) {
        album.image_url = getBlobUrl(album.image_url);
      }

      return album;
    } catch (error) {
      console.error("Error fetching album:", error);
      throw error;
    }
  }

  /**
   * Gets multiple albums.
   * @param options - Options for pagination and including related data.
   * @param options.includeArtist - Option to include the artist data.
   * @param options.includeLikes - Option to include the like count.
   * @param options.includeRuntime - Option to include the total runtime of the album.
   * @param options.limit - Maximum number of albums to return.
   * @param options.offset - Number of albums to skip.
   * @returns A list of albums.
   * @throws Error if the operation fails.
   */
  static async getMany(options?: {
    includeArtist?: boolean;
    includeLikes?: boolean;
    includeRuntime?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Album[]> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const sql = `
        SELECT
          a.*,
          CASE WHEN $1 THEN row_to_json(ar.*) 
          ELSE NULL END as artist,
          CASE WHEN $2 THEN (SELECT COUNT(*) FROM album_likes al 
            WHERE al.album_id = a.id) 
          ELSE NULL END as likes,
          CASE WHEN $3 THEN (SELECT SUM(s.duration) FROM songs s 
            JOIN album_songs als ON s.id = als.song_id WHERE als.album_id = a.id) 
          ELSE NULL END as runtime
        FROM albums a
        LEFT JOIN artists ar ON a.created_by = ar.id
        ORDER BY a.created_at DESC
        LIMIT $4 OFFSET $5
      `;

      const params = [
        options?.includeArtist ?? false,
        options?.includeLikes ?? false,
        options?.includeRuntime ?? false,
        limit,
        offset,
      ];

      const albums = await query(sql, params);
      if (!albums || albums.length === 0) {
        return [];
      }

      const processedAlbums = await Promise.all(
        albums.map(async (album: Album) => {
          if (album.image_url) {
            album.image_url = getBlobUrl(album.image_url);
          }
          return album;
        })
      );

      return processedAlbums;
    } catch (error) {
      console.error("Error fetching albums:", error);
      throw error;
    }
  }

  /**
   * Adds a song to an album
   * @param albumId - The ID of the album
   * @param songId - The ID of the song to add
   * @param track_number - The track number of the song in the album
   */
  static async addSong(albumId: UUID, songId: UUID, track_number: number) {
    try {
      const valid = await validateMany([
        { id: albumId, type: "album" },
        { id: songId, type: "song" },
      ]);
      if (!valid) {
        throw new Error("Invalid album ID or song ID");
      }

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

  /**
   * Removes a song from an album
   * @param albumId - The ID of the album
   * @param songId - The ID of the song to remove
   */
  static async removeSong(albumId: UUID, songId: UUID) {
    try {
      const valid = await validateMany([
        { id: albumId, type: "album" },
        { id: songId, type: "song" },
      ]);
      if (!valid) {
        throw new Error("Invalid album ID or song ID");
      }

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

  /**
   * Fetches songs for a given album.
   * @param albumId - The ID of the album.
   * @param options - Options for pagination.
   * @param options.limit - Maximum number of songs to return.
   * @param options.offset - Number of songs to skip.
   * @returns A list of songs in the album.
   * @throws Error if the operation fails.
   */
  static async getSongs(
    albumId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Song[]> {
    try {
      if (!(await validateAlbumId(albumId))) {
        throw new Error("Invalid album ID");
      }

      const params = [albumId, options?.limit || 50, options?.offset || 0];
      const sql = `
        SELECT s.*, as.track_number FROM songs s
        JOIN album_songs as ON s.id = as.song_id
        WHERE as.album_id = $1
        ORDER BY as.track_number ASC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, params);
      return res;
    } catch (error) {
      console.error("Error fetching album songs:", error);
      throw error;
    }
  }

  /**
   * Counts the total number of albums.
   * @param albumId - The ID of the album.
   * @return The total number of albums.
   * @throws Error if the operation fails.
   */
  static async count(albumId: UUID): Promise<number> {
    try {
      if (!(await validateAlbumId(albumId))) {
        throw new Error("Invalid album ID");
      }

      const res = await query(`SELECT COUNT(*) FROM albums WHERE id = $1`, [
        albumId,
      ]);
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting albums:", error);
      throw error;
    }
  }
}
