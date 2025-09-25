import { Artist, UUID } from "@types";
import { query, withTransaction } from "../config/database";
import { SongRepository as Song } from "@repositories";
import { getBlobUrl } from "config/blobStorage";
import { validateArtistId, validateMany } from "@validators";

export default class ArtistRepository {
  /* ----------------------------- HELPER METHODS ----------------------------- */

  /**
   * Fetches the user who made the artist and attaches it to the artist object.
   * @param artist - The artist object.
   * @throws Error if the database query fails.
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

  /**
   * Gets the songs for an artist.
   * @param artist The artist object.
   * @throws Error if the database query fails.
   */
  private static async getSongs(artist: Artist) {
    try {
      const songIds = await query(
        `SELECT s.id, sa.role FROM songs s
        JOIN song_artists sa ON s.id = sa.song_id
        WHERE sa.artist_id = $1`,
        [artist.id]
      );

      if (songIds && songIds.length > 0) {
        for (const { id, role } of songIds) {
          const song = await Song.getOne(id, {
            includeAlbum: true,
            includeArtists: true,
          });
          if (song) {
            if (!artist.songs) {
              artist.songs = [];
            }
            artist.songs.push({ song, role });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching artist songs:", error);
      throw error;
    }
  }

  /**
   * Gets the albums for an artist.
   * @param artist The artist object.
   * @throws Error if the database query fails.
   */
  private static async getAlbums(artist: Artist) {
    try {
      const albums = await query(
        `SELECT a.* FROM albums a
        JOIN artists ar ON a.created_by = ar.id
        WHERE ar.id = $1`,
        [artist.id]
      );

      if (albums) {
        artist.albums = albums;
        for (const album of artist.albums) {
          if (album && album.image_url) {
            album.image_url = getBlobUrl(album.image_url);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching artist albums:", error);
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
   * @throws Will throw an error if the database query fails.
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
   * @throws Error if no fields are provided to update or if the database query fails.
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
   * @throws Will throw an error if the database query fails.
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

  static async getOne(
    id: UUID,
    options?: {
      includeUser?: boolean;
      includeSongs?: boolean;
      includeAlbums?: boolean;
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
      if (options?.includeSongs) {
        await this.getSongs(artist);
      }
      if (options?.includeAlbums) {
        await this.getAlbums(artist);
      }

      return artist;
    } catch (error) {
      console.error("Error fetching artist:", error);
      throw error;
    }
  }

  static async getMany(options?: {
    includeUser?: boolean;
    includeSongs?: boolean;
    includeAlbums?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Artist[]> {
    try {
      let baseQuery = "SELECT * FROM artists ORDER BY created_at DESC";
      const params: any[] = [];

      if (options?.limit) {
        baseQuery += ` LIMIT $${params.length + 1}`;
        params.push(options.limit);

        if (options?.offset) {
          baseQuery += ` OFFSET $${params.length + 1}`;
          params.push(options.offset);
        }
      }

      const artists = await query(baseQuery, params);

      if (!artists || artists.length === 0) {
        return [];
      }

      const processedArtists = await Promise.all(
        artists.map(async (artist) => {
          if (options?.includeUser) {
            await this.getUser(artist);
          }
          if (options?.includeSongs) {
            await this.getSongs(artist);
          }
          if (options?.includeAlbums) {
            await this.getAlbums(artist);
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
   * Adds an artist to a song with a specific role.
   * @param artistId The ID of the artist.
   * @param songId The ID of the song.
   * @param role The role of the artist in the song
   * @throws Error if the database query fails.
   */
  static async addToSong(artistId: UUID, songId: UUID, role: string) {
    try {
      if (
        !(await validateMany([
          { id: artistId, type: "artist" },
          { id: songId, type: "song" },
        ]))
      ) {
        throw new Error("Invalid artist ID or song ID");
      }

      await query(
        `INSERT INTO song_artists (song_id, artist_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (song_id, artist_id) 
        DO UPDATE SET role = EXCLUDED.role`,
        [songId, artistId, role]
      );
    } catch (error) {
      console.error("Error adding artist to song:", error);
      throw error;
    }
  }

  /**
   * Removes an artist from a song.
   * @param artistId The ID of the artist.
   * @param songId The ID of the song.
   * @throws Error if the database query fails.
   */
  static async removeFromSong(artistId: UUID, songId: UUID) {
    try {
      if (
        !(await validateMany([
          { id: artistId, type: "artist" },
          { id: songId, type: "song" },
        ]))
      ) {
        throw new Error("Invalid artist ID or song ID");
      }

      await query(
        `DELETE FROM song_artists 
        WHERE song_id = $1 AND artist_id = $2`,
        [songId, artistId]
      );
    } catch (error) {
      console.error("Error removing artist from song:", error);
      throw error;
    }
  }
}
