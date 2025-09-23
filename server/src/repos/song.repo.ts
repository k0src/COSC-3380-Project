import { Song, UUID, SongComment } from "@types";
import { query, withTransaction } from "../config/database.js";
import { getBlobUrl } from "../config/blobStorage.js";

// before: backend parse, sanitize, validate, set release date = now if not provided, calc duration,
// then call repo

export default class SongRepository {
  /* ----------------------------- HELPER METHODS ----------------------------- */

  private static async getAlbum(song: Song): Promise<void> {
    if (!song.album_id) return;

    const albums = await query("SELECT * FROM albums WHERE id = $1", [
      song.album_id,
    ]);

    if (albums && albums.length > 0) {
      song.album = albums[0];
      if (song.album?.image_url) {
        song.album.image_url = getBlobUrl(song.album.image_url);
      }
    }
  }

  private static async getArtists(song: Song): Promise<void> {
    const artists = await query(
      `SELECT a.*, sa.role 
       FROM artists a
       JOIN song_artists sa ON a.id = sa.artist_id
       WHERE sa.song_id = $1`, 
      [song.id]
    );

    if (artists) {
      song.artists = artists;
    }
  }

  private static async getLikes(song: Song): Promise<void> {
    const likes = await query(
      "SELECT COUNT(*) AS likes FROM song_likes WHERE song_id = $1",
      [song.id]
    );

    if (likes && likes.length > 0) {
      song.likes = parseInt(likes[0].likes, 10) || 0;
    }
  }

  private static getBlobUrls(song: Song): void {
    if (song.image_url) {
      song.image_url = getBlobUrl(song.image_url);
    }
    if (song.audio_url) {
      song.audio_url = getBlobUrl(song.audio_url);
    }
  }

  /* ------------------------------ MAIN METHODS ------------------------------ */

  // Creates a new song and adds it to the database
  static async create({
    title,
    duration,
    album_id,
    genre,
    release_date,
    image_url,
    audio_url,
  }: {
    title: string;
    duration: number;
    album_id?: UUID;
    genre: string;
    release_date: number;
    image_url?: string;
    audio_url: string;
  }): Promise<Song | null> {
    try {
      const result = await query(
        `INSERT INTO songs 
          (title, duration, album_id, genre, release_date, image_url, audio_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [title, duration, album_id, genre, release_date, image_url, audio_url]
      );
      return result[0] ?? null;
    } catch (error) {
      console.error("Error creating song:", error);
      throw error;
    }
  }

  // Updates song details
  static async update(
    id: UUID,
    {
      title,
      image_url,
      audio_url,
      album_id,
      release_date,
      duration,
      genre,
    }: {
      title?: string;
      image_url?: string;
      audio_url?: string;
      album_id?: UUID;
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
      if (album_id !== undefined) {
        fields.push(`album_id = $${values.length + 1}`);
        values.push(album_id);
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

      const result = await withTransaction(async (client) => {
        const sql = `UPDATE songs SET ${fields.join(", ")} WHERE id = $${
          values.length
        } RETURNING *`;
        const res = await client.query(sql, values);
        return res.rows[0] ?? null;
      });

      return result;
    } catch (error) {
      console.error("Error updating song:", error);
      throw error;
    }
  }

  // Deletes song from DB
  static async delete(id: UUID): Promise<Song | null> {
    try {
      const result = await withTransaction(async (client) => {
        const res = await client.query(
          "DELETE FROM songs WHERE id = $1 RETURNING *",
          [id]
        );
        return res.rows[0] ?? null;
      });

      return result;
    } catch (error) {
      console.error("Error deleting song:", error);
      throw error;
    }
  }

  // Gets one song by ID, with optional related data
  static async getOne(
    id: UUID,
    options?: {
      includeAlbum?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
    }
  ): Promise<Song | null> {
    try {
      const songs = await query("SELECT * FROM songs WHERE id = $1", [id]);

      if (!songs || songs.length === 0) {
        return null;
      }

      let song = songs[0] as Song;

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

  // Gets multiple songs, with optional related data
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

  // Gets song comments
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
