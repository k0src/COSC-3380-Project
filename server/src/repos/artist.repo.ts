import { Album, Artist, Song, UUID } from "@types";
import { query, withTransaction } from "../config/database";
import { getBlobUrl } from "config/blobStorage";
import { validateArtistId } from "@validators";

export default class ArtistRepository {
  /* ----------------------------- HELPER METHODS ----------------------------- */

  /**
   * Fetches the user who made the artist and attaches it to the artist object.
   * @param artist - The artist object.
   * @throws Error if the operation fails.
   */
  private static async getUser(artist: Artist) {
    try {
      const user = await query(
        `SELECT u.* FROM users u
        JOIN artists a ON u.id = a.user_id
        WHERE a.id = $1`,
        [artist.id]
      );

      if (user && user.length > 0) {
        artist.user = user[0];
        if (artist.user && artist.user.profile_picture_url) {
          artist.user.profile_picture_url = getBlobUrl(
            artist.user.profile_picture_url
          );
        }
      }
    } catch (error) {
      console.error("Error fetching artist user:", error);
      throw error;
    }
  }

  /* ------------------------------ MAIN METHODS ------------------------------ */

  /**
   * Creates a new artist.
   * @param artistData - The data for the new artist.
   * @param artist.display_name - The display name of the artist.
   * @param artist.bio - The bio of the artist.
   * @param artist.user_id - The user ID associated with the artist.
   * @returns The created artist, or null if creation fails.
   * @throws Error if the operation fails.
   */
  static async create({
    display_name,
    bio,
    user_id,
  }: {
    display_name: string;
    bio?: string;
    user_id: UUID;
  }): Promise<Artist | null> {
    try {
      const res = await query(
        `INSERT INTO artists (display_name, bio, user_id)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [display_name, bio, user_id]
      );

      return res[0] ?? null;
    } catch (error) {
      console.error("Error creating artist:", error);
      throw error;
    }
  }

  /**
   * Updates a artist.
   * @param id - The ID of the artist to update.
   * @param artistData - The new data for the artist.
   * @param artist.display_name - The new display name of the artist (optional).
   * @param artist.bio - The new bio of the artist (optional).
   * @param artist.user_id - The new user ID associated with the artist (optional).
   * @returns The updated artist, or null if the update fails.
   * @throws Error if the operation fails.
   */
  static async update(
    id: UUID,
    {
      display_name,
      bio,
      user_id,
    }: { display_name?: string; bio?: string; user_id?: UUID }
  ): Promise<Artist | null> {
    try {
      if (!(await validateArtistId(id))) {
        throw new Error("Invalid artist ID");
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (display_name !== undefined) {
        fields.push(`display_name = $${values.length}`);
        values.push(display_name);
      }
      if (bio !== undefined) {
        fields.push(`bio = $${values.length}`);
        values.push(bio);
      }
      if (user_id !== undefined) {
        fields.push(`user_id = $${values.length}`);
        values.push(user_id);
      }
      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(id);

      const res = await withTransaction(async (client) => {
        const sql = `UPDATE artists SET ${fields.join(", ")} WHERE id = $${
          values.length
        } RETURNING *`;
        const result = await client.query(sql, values);
        return result.rows[0];
      });

      return res;
    } catch (error) {
      console.error("Error updating artist:", error);
      throw error;
    }
  }

  /**
   * Deletes a artist.
   * @param id - The ID of the artist to delete.
   * @returns The deleted artist, or null if the deletion fails.
   * @throws Error if the operation fails.
   */
  static async delete(id: UUID): Promise<Artist | null> {
    try {
      if (!(await validateArtistId(id))) {
        throw new Error("Invalid artist ID");
      }

      const res = await withTransaction(async (client) => {
        const del = await client.query(
          "DELETE FROM artists WHERE id = $1 RETURNING *",
          [id]
        );
        return del.rows[0] ?? null;
      });

      return res;
    } catch (error) {
      console.error("Error deleting artist:", error);
      throw error;
    }
  }

  /**
   * Fetches a single artist by ID.
   * @param id - The ID of the artist to fetch.
   * @param options - Options to include related data.
   * @param options.includeUser - Option to include the user who created the artist.
   * @returns The artist with the specified ID, or null if not found.
   * @throws Error if the operation fails.
   */
  static async getOne(
    id: UUID,
    options?: {
      includeUser?: boolean;
    }
  ): Promise<Artist | null> {
    try {
      if (!(await validateArtistId(id))) {
        throw new Error("Invalid artist ID");
      }

      const res = await query("SELECT * FROM artists WHERE id = $1", [id]);

      if (!res || res.length === 0) {
        return null;
      }

      let artist: Artist = res[0];

      if (options?.includeUser) {
        await this.getUser(artist);
      }

      return artist;
    } catch (error) {
      console.error("Error fetching artist:", error);
      throw error;
    }
  }

  /**
   * Fetches multiple artists.
   * @param options - Options for pagination and including related data.
   * @param options.includeUser - Option to include the user who created each artist.
   * @param options.limit - Maximum number of artists to return.
   * @param options.offset - Number of artists to skip.
   * @returns A list of artists.
   * @throws Error if the operation fails.
   */
  static async getMany(options?: {
    includeUser?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Artist[]> {
    try {
      const params = [options?.limit || 50, options?.offset || 0];
      const sql = `
        SELECT * FROM artists
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const artists = await query(sql, params);
      if (!artists || artists.length === 0) {
        return [];
      }

      const processedArtists = await Promise.all(
        artists.map(async (artist) => {
          if (options?.includeUser) {
            await this.getUser(artist);
          }
          return artist;
        })
      );

      return processedArtists;
    } catch (error) {
      console.error("Error fetching artists:", error);
      throw error;
    }
  }

  /**
   * Fetches songs for a given artist.
   * @param artistId - The ID of the artist.
   * @param options - Options for pagination.
   * @param options.limit - Maximum number of songs to return.
   * @param options.offset - Number of songs to skip.
   * @returns A list of songs in the artist's catalog.
   * @throws Error if the operation fails.
   */
  static async getSongs(
    artistId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Song[]> {
    try {
      if (!(await validateArtistId(artistId))) {
        throw new Error("Invalid artist ID");
      }

      const params = [artistId, options?.limit || 50, options?.offset || 0];
      const sql = `
        SELECT s.*, sa.role FROM songs s
        JOIN song_artists sa ON s.id = sa.song_id
        WHERE sa.artist_id = $1
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, params);
      return res;
    } catch (error) {
      console.error("Error fetching songs for artist:", error);
      throw error;
    }
  }

  /**
   * Fetches albums for a given artist.
   * @param artistId - The ID of the artist.
   * @param options - Options for pagination.
   * @param options.limit - Maximum number of albums to return.
   * @param options.offset - Number of albums to skip.
   * @returns A list of albums by the artist.
   * @throws Error if the operation fails.
   */
  static async getAlbums(
    artistId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Album[]> {
    try {
      if (!(await validateArtistId(artistId))) {
        throw new Error("Invalid artist ID");
      }

      const params = [artistId, options?.limit || 50, options?.offset || 0];
      const sql = `
        SELECT al.* FROM albums al
        JOIN album_songs als ON al.id = als.album_id
        JOIN song_artists sa ON als.song_id = sa.song_id
        WHERE sa.artist_id = $1
        GROUP BY al.id
        ORDER BY al.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, params);
      return res;
    } catch (error) {
      console.error("Error fetching albums for artist:", error);
      throw error;
    }
  }

  /**
   * Counts the total number of artists.
   * @param artistId - The ID of the artist.
   * @return The total number of artists.
   * @throws Error if the operation fails.
   */
  static async count(artistId: UUID): Promise<number> {
    try {
      if (!(await validateArtistId(artistId))) {
        throw new Error("Invalid artist ID");
      }

      const res = await query(`SELECT COUNT(*) FROM artists WHERE id = $1`, [
        artistId,
      ]);
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting artists:", error);
      throw error;
    }
  }
}
