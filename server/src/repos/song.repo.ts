import { Song, UUID, Album, SongArtist } from "@types";
import { query, withTransaction } from "@config/database";
import { getBlobUrl } from "@config/blobStorage";

export default class SongRepository {
  /**
   * Creates a new song.
   * @param songData - The data for the new song.
   * @param song.title - The title of the song.
   * @param song.duration - The duration of the song in seconds.
   * @param song.genre - The genre of the song.
   * @param song.release_date - The release date of the song as an ISO string
   * @returns The created song, or null if creation fails.
   * @throws Error if the operation fails.
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
   * @throws Error if the operation fails.
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
   * @throws Error if the operation fails.
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
   * @throws Error if the operation fails.
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
      const sql = `
        SELECT s.*,
        CASE WHEN $1 THEN row_to_json(a.*)
        ELSE NULL END AS album,
        CASE WHEN $2 THEN
          (SELECT json_agg(row_to_json(ar.*)) FROM artists ar
          JOIN song_artists sa ON sa.artist_id = ar.id
          WHERE sa.song_id = s.id)
        ELSE NULL END AS artists,
        CASE WHEN $3 THEN
          (SELECT COUNT(*) FROM song_likes sl
          WHERE sl.song_id = s.id)
        ELSE NULL END AS likes
        FROM songs s
        LEFT JOIN album_songs als ON als.song_id = s.id
        LEFT JOIN albums a ON als.album_id = a.id
        WHERE s.id = $4
      `;

      const params = [
        options?.includeAlbum ?? false,
        options?.includeArtists ?? false,
        options?.includeLikes ?? false,
        id,
      ];

      const res = await query(sql, params);
      if (!res || res.length === 0) {
        return null;
      }

      let song: Song = res[0];
      if (song.image_url) {
        song.image_url = getBlobUrl(song.image_url);
      }
      if (song.audio_url) {
        song.audio_url = getBlobUrl(song.audio_url);
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
   * @throws Error if the operation fails.
   */
  static async getMany(options?: {
    includeAlbum?: boolean;
    includeArtists?: boolean;
    includeLikes?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Song[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const sql = `
        SELECT s.*,
        CASE WHEN $1 THEN row_to_json(a.*)
        ELSE NULL END AS album,
        CASE WHEN $2 THEN
          (SELECT json_agg(row_to_json(ar.*)) FROM artists ar
          JOIN song_artists sa ON sa.artist_id = ar.id
          WHERE sa.song_id = s.id)
        ELSE NULL END AS artists,
        CASE WHEN $3 THEN
          (SELECT COUNT(*) FROM song_likes sl
          WHERE sl.song_id = s.id)
        ELSE NULL END AS likes
        FROM songs s
        LEFT JOIN album_songs als ON als.song_id = s.id
        LEFT JOIN albums a ON als.album_id = a.id
        ORDER BY s.created_at DESC
        LIMIT $4 OFFSET $5
      `;

      const params = [
        options?.includeAlbum ?? false,
        options?.includeArtists ?? false,
        options?.includeLikes ?? false,
        limit,
        offset,
      ];

      const songs = await query(sql, params);
      if (!songs || songs.length === 0) {
        return [];
      }

      const processedSongs = await Promise.all(
        songs.map(async (song) => {
          if (song.image_url) {
            song.image_url = getBlobUrl(song.image_url);
          }
          if (song.audio_url) {
            song.audio_url = getBlobUrl(song.audio_url);
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

  /**
   * Adds an artist to a song with a specific role.
   * @param artistId - The ID of the artist to add.
   * @param songId - The ID of the song to which the artist is added.
   * @param role - The role of the artist in the song.
   * @throws Error if the database query fails or if the IDs are invalid.
   */
  static async addArtist(artistId: UUID, songId: UUID, role: string) {
    try {
      await query(
        `INSERT INTO song_artists (song_id, artist_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (artist_id, song_id)
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
   * @param artistId - The ID of the artist to remove.
   * @param songId - The ID of the song from which the artist is removed.
   * @throws Error if the database query fails or if the IDs are invalid.
   */
  static async removeArtist(artistId: UUID, songId: UUID) {
    try {
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

  /**
   * Counts the total number of songs.
   * @return The total number of songs.
   * @throws Error if the operation fails.
   */
  static async count(): Promise<number> {
    try {
      const res = await query("SELECT COUNT(*) FROM songs");
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting songs:", error);
      throw error;
    }
  }

  /**
   * Fetches the album for a given song.
   * @param songId - The ID of the song.
   * @param options - Options for pagination and including related data.
   * @param options.includeArtist - Option to include the artist data.
   * @param options.includeLikes - Option to include the like count.
   * @param options.includeRuntime - Option to include the total runtime of the album.
   * @param options.includeSongCount - Option to include the total number of songs on the album.
   * @returns The album of the song, or null if not found.
   * @throws Error if the operation fails.
   */
  static async getAlbum(
    songId: UUID,
    options?: {
      includeArtist?: boolean;
      includeLikes?: boolean;
      includeRuntime?: boolean;
      includeSongCount?: boolean;
    }
  ): Promise<Album | null> {
    try {
      const sql = `
        SELECT a.*,
        CASE WHEN $1 THEN row_to_json(ar.*)
        ELSE NULL END AS artist,
        CASE WHEN $2 THEN (SELECT COUNT(*) FROM album_likes al
          WHERE al.album_id = a.id)
        ELSE NULL END AS likes,
        CASE WHEN $3 THEN (SELECT SUM(s.duration) FROM songs s
          JOIN album_songs als ON als.song_id = s.id
          WHERE als.album_id = a.id)
        ELSE NULL END AS runtime,
        CASE WHEN $4 THEN (SELECT COUNT(*) FROM album_songs als
          WHERE als.album_id = a.id)
        ELSE NULL END AS song_count
        FROM albums a
        LEFT JOIN artists ar ON a.created_by = ar.id
        LEFT JOIN album_songs als ON als.album_id = a.id
        WHERE als.song_id = $5
      `;

      const params = [
        options?.includeArtist ?? false,
        options?.includeLikes ?? false,
        options?.includeRuntime ?? false,
        options?.includeSongCount ?? false,
        songId,
      ];

      const res = await query(sql, params);
      return res[0] ?? null;
    } catch (error) {
      console.error("Error fetching album:", error);
      throw error;
    }
  }

  /**
   * Fetches artists for a given song.
   * @param songId - The ID of the song.
   * @param options.includeUser - Option to include the user who created each artist.
   * @param options.limit - Maximum number of artists to return.
   * @param options.offset - Number of artists to skip.
   * @returns A list of artists associated with the song.
   * @throws Error if the operation fails.
   */
  static async getArtists(
    songId: UUID,
    options?: {
      includeUser?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<SongArtist[]> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const sql = `
        SELECT sa.role, a.*,
        CASE WHEN $1 THEN row_to_json(u.*)
        ELSE NULL END AS user
        FROM artists a
        JOIN song_artists sa ON sa.artist_id = a.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE sa.song_id = $2
        LIMIT $3 OFFSET $4
      `;

      const params = [options?.includeUser ?? false, songId, limit, offset];

      const artists = await query(sql, params);
      if (!artists || artists.length === 0) {
        return [];
      }

      const processedArtists = await Promise.all(
        artists.map(async (artist) => {
          if (artist.user && artist.user.profile_picture_url) {
            artist.user.profile_picture_url = getBlobUrl(
              artist.user.profile_picture_url
            );
          }
          return artist;
        })
      );

      return processedArtists;
    } catch (error) {
      console.error("Error fetching artists for song:", error);
      throw error;
    }
  }
}
