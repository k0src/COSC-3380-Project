import { Song, UUID, SongComment } from "@types";
import { query, withTransaction } from "../config/database.js";
import { getBlobUrl } from "../config/blobStorage.js";

// before: backend parse, sanitize, validate, set release date = now if not provided, calc duration,
// then call repo

export default class SongRepository {
  /* ----------------------------- HELPER METHODS ----------------------------- */

  /**
   * Fetches the album for a song and attaches it to the song object.
   * @param song - The song object.
   * @throws Will throw an error if the database query fails.
   */
  private static async getAlbum(song: Song) {
    const album = await query(
      `SELECT a.* FROM albums a
      JOIN album_songs als ON a.id = als.album_id
      WHERE als.song_id = $1
      LIMIT 1`,
      [song.id]
    );

    if (album && album.length > 0) {
      song.album = album[0];
      if (song.album?.image_url) {
        song.album.image_url = getBlobUrl(song.album.image_url);
      }
    }
  }

  /**
   * Fetches the artists for a song and attaches them to the song object.
   * @param song - The song object.
   * @throws Will throw an error if the database query fails.
   */
  private static async getArtists(song: Song) {
    const artists = await query(
      `SELECT a.*, sa.role 
       FROM artists a
       JOIN song_artists sa ON a.id = sa.artist_id
       WHERE sa.song_id = $1`,
      [song.id]
    );

    if (artists) {
      if (!song.artists) {
        song.artists = [];
      }
      song.artists = artists;
    }
  }

  /**
   * Fetches the like count for a song and attaches it to the song object.
   * @param song - The song object.
   * @throws Will throw an error if the database query fails.
   */
  private static async getLikes(song: Song) {
    const likes = await query(
      "SELECT COUNT(*) AS likes FROM song_likes WHERE song_id = $1",
      [song.id]
    );

    if (likes && likes.length > 0) {
      song.likes = parseInt(likes[0].likes, 10) || 0;
    }
  }

  /**
   * Converts image and audio URLs to full blob URLs.
   * @param song - The song object.
   */
  private static getBlobUrls(song: Song) {
    if (song.image_url) {
      song.image_url = getBlobUrl(song.image_url);
    }
    if (song.audio_url) {
      song.audio_url = getBlobUrl(song.audio_url);
    }
  }

  /* ------------------------------ MAIN METHODS ------------------------------ */

  /**
   * Creates a new song.
   * @param songData - The data for the new song.
   * @param song.title - The title of the song.
   * @param song.duration - The duration of the song in seconds.
   * @param song.genre - The genre of the song.
   * @param song.release_date - The release date of the song as an ISO string
   * @returns The created song, or null if creation fails.
   * @throws Will throw an error if the database query fails.
   */
  static async create({
    title,
    duration,
    genre,
    release_date,
    image_url,
    audio_url,
  }: {
    title: string;
    duration: number;
    genre: string;
    release_date: number;
    image_url?: string;
    audio_url: string;
  }): Promise<Song | null> {
    try {
      const res = await query(
        `INSERT INTO songs 
          (title, duration, genre, release_date, image_url, audio_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [title, duration, genre, release_date, image_url, audio_url]
      );
      return res[0] ?? null;
    } catch (error) {
      console.error("Error creating song:", error);
      throw error;
    }
  }

  /**
   * Updates a song.
   * @param id - The ID of the song to update.
   * @param songData - The new data for the song.
   * @param song.title - The new title of the song (optional).
   * @param song.image_url - The new image URL of the song (optional).
   * @param song.audio_url - The new audio URL of the song (optional).
   * @param song.release_date - The new release date of the song as an ISO string (optional).
   * @param song.duration - The new duration of the song in seconds (optional).
   * @param song.genre - The new genre of the song (optional).
   * @returns The updated song, or null if the update fails.
   * @throws Error if no fields are provided to update or if the database query fails.
   */
  static async update(
    id: UUID,
    {
      title,
      image_url,
      audio_url,
      release_date,
      duration,
      genre,
    }: {
      title?: string;
      image_url?: string;
      audio_url?: string;
      release_date?: number;
      duration?: number;
      genre?: string;
    }
  ): Promise<Song | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (title !== undefined) {
        fields.push(`title = $${values.length + 1}`);
        values.push(title);
      }
      if (image_url !== undefined) {
        fields.push(`image_url = $${values.length + 1}`);
        values.push(image_url);
      }
      if (audio_url !== undefined) {
        fields.push(`audio_url = $${values.length + 1}`);
        values.push(audio_url);
      }
      if (release_date !== undefined) {
        fields.push(`release_date = $${values.length + 1}`);
        values.push(release_date);
      }
      if (duration !== undefined) {
        fields.push(`duration = $${values.length + 1}`);
        values.push(duration);
      }
      if (genre !== undefined) {
        fields.push(`genre = $${values.length + 1}`);
        values.push(genre);
      }
      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(id);

      const res = await withTransaction(async (client) => {
        const sql = `UPDATE songs SET ${fields.join(", ")} WHERE id = $${
          values.length
        } RETURNING *`;
        const res = await client.query(sql, values);
        return res.rows[0] ?? null;
      });

      return res;
    } catch (error) {
      console.error("Error updating song:", error);
      throw error;
    }
  }

  /**
   * Deletes a song.
   * @param id - The ID of the song to delete.
   * @returns The deleted song, or null if the deletion fails.
   * @throws Will throw an error if the database query fails.
   */
  static async delete(id: UUID): Promise<Song | null> {
    try {
      const res = await withTransaction(async (client) => {
        const del = await client.query(
          "DELETE FROM songs WHERE id = $1 RETURNING *",
          [id]
        );
        return del.rows[0] ?? null;
      });

      return res;
    } catch (error) {
      console.error("Error deleting song:", error);
      throw error;
    }
  }

  /**
   * Gets a single song by ID.
   * @param id - The ID of the song to get.
   * @param options - Options for including related data.
   * @param options.includeAlbum - Option to include the album data.
   * @param options.includeArtists - Option to include the artists data.
   * @param options.includeLikes - Option to include the like count.
   * @returns The song, or null if not found.
   * @throws Will throw an error if the database query fails.
   */
  static async getOne(
    id: UUID,
    options?: {
      includeAlbum?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
    }
  ): Promise<Song | null> {
    try {
      const res = await query("SELECT * FROM songs WHERE id = $1", [id]);

      if (!res || res.length === 0) {
        return null;
      }

      let song: Song = res[0];

      this.getBlobUrls(song);

      if (options?.includeAlbum) {
        await this.getAlbum(song);
      }
      if (options?.includeArtists) {
        await this.getArtists(song);
      }
      if (options?.includeLikes) {
        await this.getLikes(song);
      }

      return song;
    } catch (error) {
      console.error("Error fetching song:", error);
      throw error;
    }
  }

  /**
   * Gets multiple songs.
   * @param options - Options for pagination and including related data.
   * @param options.includeAlbum - Option to include the album data.
   * @param options.includeArtists - Option to include the artists data.
   * @param options.includeLikes - Option to include the like count.
   * @param options.limit - Maximum number of songs to return.
   * @param options.offset - Number of songs to skip.
   * @returns A list of songs.
   * @throws Will throw an error if the database query fails.
   */
  static async getMany(options?: {
    includeAlbum?: boolean;
    includeArtists?: boolean;
    includeLikes?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Song[]> {
    try {
      let baseQuery = "SELECT * FROM songs ORDER BY created_at DESC";
      const params: any[] = [];

      if (options?.limit) {
        baseQuery += ` LIMIT $${params.length + 1}`;
        params.push(options.limit);

        if (options?.offset) {
          baseQuery += ` OFFSET $${params.length + 1}`;
          params.push(options.offset);
        }
      }

      const songs = await query(baseQuery, params);

      if (!songs || songs.length === 0) {
        return [];
      }

      const processedSongs = await Promise.all(
        songs.map(async (song: Song) => {
          this.getBlobUrls(song);

          if (options?.includeAlbum) {
            await this.getAlbum(song);
          }
          if (options?.includeArtists) {
            await this.getArtists(song);
          }
          if (options?.includeLikes) {
            await this.getLikes(song);
          }

          return song;
        })
      );

      return processedSongs;
    } catch (error) {
      console.error("Error fetching songs:", error);
      throw error;
    }
  }

  // MOVE TO COMMENT SERVICE with get comments by user, song
  /**
   * Gets comments for a song.
   * @param id - The ID of the song.
   * @param limit - The maximum number of comments to return.
   * @param offset - The number of comments to skip.
   * @returns List of comments, or null if fetching fails.
   * @throws Error if the database query fails.
   */
  static async getComments(
    id: UUID,
    limit: number,
    offset: number
  ): Promise<SongComment[] | null> {
    try {
      const comments = await query(
        `SELECT 
          user_id, 
          comment_text, 
          users.username, 
          users.profile_picture_url, 
          commented_at
        FROM song_comments 
        JOIN users ON song_comments.user_id = users.id
        WHERE song_id = $1 
        ORDER BY commented_at DESC 
        LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      return comments ?? null;
    } catch (error) {
      console.error("Error fetching song comments:", error);
      throw error;
    }
  }
}
