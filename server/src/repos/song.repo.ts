import { Song, UUID, Album, SongArtist, SuggestedSong } from "@types";
import { query, withTransaction } from "@config/database";
import { getBlobUrl } from "@config/blobStorage";

export default class SongRepository {
  static async create({
    title,
    owner_id,
    duration,
    genre,
    release_date,
    image_url,
    image_url_blurhash,
    audio_url,
    visibility_status,
  }: {
    title: string;
    owner_id: UUID;
    duration: number;
    genre: string;
    release_date?: string;
    image_url?: string;
    image_url_blurhash?: string;
    audio_url: string;
    visibility_status?: string;
  }): Promise<Song | null> {
    try {
      if (!title || typeof title !== "string" || title.trim() === "") {
        throw new Error("Song title cannot be empty");
      }

      if (!release_date) {
        release_date = new Date().toISOString().split("T")[0];
      }

      const res = await withTransaction(async (client) => {
        const insert = await client.query(
          `INSERT INTO songs (
            title,
            owner_id,
            duration,
            genre,
            release_date,
            image_url,
            image_url_blurhash,
            audio_url,
            visibility_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
          [
            title,
            owner_id,
            duration,
            genre,
            release_date,
            image_url,
            image_url_blurhash,
            audio_url,
            visibility_status,
          ]
        );
        return insert.rows[0] ?? null;
      });

      if (res) {
        if (res.image_url) {
          res.image_url = getBlobUrl(res.image_url);
        }
        res.type = "song";
      }

      return res;
    } catch (error) {
      console.error("Error inserting song:", error);
      throw error;
    }
  }

  static async update(
    id: UUID,
    {
      title,
      duration,
      genre,
      release_date,
      image_url,
      image_url_blurhash,
      audio_url,
      visibility_status,
    }: {
      title?: string;
      duration?: number;
      genre?: string;
      release_date?: string;
      image_url?: string;
      image_url_blurhash?: string;
      audio_url?: string;
      visibility_status?: string;
    }
  ): Promise<Song | null> {
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
        fields.push(`title = $${values.length + 1}`);
        values.push(title);
      }
      if (duration !== undefined) {
        fields.push(`duration = $${values.length + 1}`);
        values.push(duration);
      }
      if (genre !== undefined) {
        fields.push(`genre = $${values.length + 1}`);
        values.push(genre);
      }
      if (release_date !== undefined) {
        fields.push(`release_date = $${values.length + 1}`);
        values.push(release_date);
      }
      if (image_url !== undefined) {
        fields.push(`image_url = $${values.length + 1}`);
        values.push(image_url);
      }
      if (image_url_blurhash !== undefined) {
        fields.push(`image_url_blurhash = $${values.length + 1}`);
        values.push(image_url_blurhash);
      }
      if (audio_url !== undefined) {
        fields.push(`audio_url = $${values.length + 1}`);
        values.push(audio_url);
      }
      if (visibility_status !== undefined) {
        fields.push(`visibility_status = $${values.length + 1}`);
        values.push(visibility_status);
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

      if (res) {
        if (res.image_url) {
          res.image_url = getBlobUrl(res.image_url);
        }
        res.type = "song";
      }

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
          `DELETE FROM songs WHERE id = $1 RETURNING *`,
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
   * @param options.includeAlbums - Option to include the albums data.
   * @param options.includeArtists - Option to include the artists data.
   * @param options.includeLikes - Option to include the like count.
   * @param options.includeComments - Option to include the comment count.
   * @returns The song, or null if not found.
   * @throws Error if the operation fails.
   */
  static async getOne(
    id: UUID,
    options?: {
      includeAlbums?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
      includeComments?: boolean;
    }
  ): Promise<Song | null> {
    try {
      const sql = `
        SELECT s.*,
          CASE WHEN $1 THEN
            (SELECT json_agg(row_to_json(album_with_artist))
            FROM (
              SELECT a.*,
                row_to_json(ar) AS artist
              FROM albums a
              JOIN album_songs als ON als.album_id = a.id
              LEFT JOIN artists ar ON ar.id = a.created_by
              WHERE als.song_id = s.id
            ) AS album_with_artist)
          ELSE NULL END AS albums,
          CASE WHEN $2 THEN
            (SELECT json_agg(row_to_json(ar_with_role))
            FROM (
              SELECT
                ar.*,
                sa.role,
                row_to_json(u) AS user
              FROM artists ar
              JOIN users u ON u.artist_id = ar.id
              JOIN song_artists sa ON sa.artist_id = ar.id
              WHERE sa.song_id = s.id
            ) AS ar_with_role)
          ELSE NULL END AS artists,
          CASE WHEN $3 THEN
            (SELECT COUNT(*) FROM song_likes sl
            WHERE sl.song_id = s.id)
          ELSE NULL END AS likes,
          CASE WHEN $4 THEN
            (SELECT COUNT(*) FROM comments c
            WHERE c.song_id = s.id)
          ELSE NULL END AS comments
        FROM songs s
        WHERE s.id = $5
      `;

      const params = [
        options?.includeAlbums ?? false,
        options?.includeArtists ?? false,
        options?.includeLikes ?? false,
        options?.includeComments ?? false,
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
      if (song.albums && song.albums?.length > 0) {
        song.albums.map(async (album) => {
          if (album.image_url) {
            album.image_url = getBlobUrl(album.image_url);
          }
          if (album.artist) {
            album.artist.type = "artist";
          }
          album.type = "album";
          return album;
        });
      }
      if (song.artists && song.artists?.length > 0) {
        song.artists.map(async (artist) => {
          if (artist.user && artist.user.profile_picture_url) {
            artist.user.profile_picture_url = getBlobUrl(
              artist.user.profile_picture_url
            );
          }
          artist.type = "artist";
          return artist;
        });
      }

      song.type = "song";
      return song;
    } catch (error) {
      console.error("Error fetching song:", error);
      throw error;
    }
  }

  /**
   * Gets multiple songs.
   * @param options Options for pagination and including related data.
   * @param options.includeAlbums Option to include the albums data.
   * @param options.includeArtists Option to include the artists data.
   * @param options.includeLikes Option to include the like count.
   * @param options.includeComments Option to include the comment count.
   * @param options.orderBy Object specifying the column and direction to order by.
   * @param options.orderBy.column The column to order by.
   * @param options.orderBy.direction The direction to order by (ASC or DESC).
   * @param options.limit Maximum number of songs to return.
   * @param options.offset Number of songs to skip.
   * @returns A list of songs.
   * @throws Error if the operation fails.
   */
  static async getMany(options?: {
    includeAlbums?: boolean;
    includeArtists?: boolean;
    includeLikes?: boolean;
    includeComments?: boolean;
    orderByColumn?:
      | "title"
      | "created_at"
      | "streams"
      | "release_date"
      | "likes"
      | "comments"
      | "duration";
    orderByDirection?: "ASC" | "DESC";
    limit?: number;
    offset?: number;
  }): Promise<Song[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const orderByColumn = options?.orderByColumn ?? "created_at";
      const orderByDirection = options?.orderByDirection ?? "DESC";

      const orderByMap: Record<string, string> = {
        title: "s.title",
        created_at: "s.created_at",
        streams: "s.streams",
        release_date: "s.release_date",
        likes: "likes",
        comments: "comments",
        duration: "s.duration",
      };

      const sqlOrderByColumn = orderByMap[orderByColumn];

      const sql = `
        SELECT s.*,
          CASE WHEN $1 THEN
            (SELECT json_agg(row_to_json(album_with_artist))
            FROM (
              SELECT a.*,
                row_to_json(ar) AS artist
              FROM albums a
              JOIN album_songs als ON als.album_id = a.id
              LEFT JOIN artists ar ON ar.id = a.created_by
              WHERE als.song_id = s.id
            ) AS album_with_artist)
          ELSE NULL END AS albums,
          CASE WHEN $2 THEN
            (SELECT json_agg(row_to_json(ar_with_role))
            FROM (
              SELECT
                ar.*,
                sa.role,
                row_to_json(u) AS user
              FROM artists ar
              JOIN users u ON u.artist_id = ar.id
              JOIN song_artists sa ON sa.artist_id = ar.id
              WHERE sa.song_id = s.id
            ) AS ar_with_role)
          ELSE NULL END AS artists,
          CASE WHEN $3 THEN
            (SELECT COUNT(*) FROM song_likes sl
            WHERE sl.song_id = s.id)
          ELSE NULL END AS likes,
          CASE WHEN $4 THEN
            (SELECT COUNT(*) FROM comments c
            WHERE c.song_id = s.id)
          ELSE NULL END AS comments
        FROM songs s
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $5 OFFSET $6
      `;

      const params = [
        options?.includeAlbums ?? false,
        options?.includeArtists ?? false,
        options?.includeLikes ?? false,
        options?.includeComments ?? false,
        limit,
        offset,
      ];

      const songs = await query(sql, params);
      if (!songs || songs.length === 0) {
        return [];
      }

      const processedSongs = await Promise.all(
        songs.map(async (song: Song) => {
          if (song.image_url) {
            song.image_url = getBlobUrl(song.image_url);
          }
          if (song.audio_url) {
            song.audio_url = getBlobUrl(song.audio_url);
          }
          if (song.albums && song.albums?.length > 0) {
            song.albums = song.albums.map((album) => {
              if (album.image_url) {
                album.image_url = getBlobUrl(album.image_url);
              }
              if (album.artist) {
                album.artist.type = "artist";
              }
              album.type = "album";
              return album;
            });
          }
          if (song.artists && song.artists?.length > 0) {
            song.artists = song.artists.map((artist) => {
              if (artist.user && artist.user.profile_picture_url) {
                artist.user.profile_picture_url = getBlobUrl(
                  artist.user.profile_picture_url
                );
              }
              artist.type = "artist";
              return artist;
            });
          }
          song.type = "song";
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
  static async addArtist(
    songId: UUID,
    artistId: UUID,
    role: string
  ): Promise<boolean> {
    try {
      await query(
        `INSERT INTO song_artists (song_id, artist_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (artist_id, song_id)
        DO UPDATE SET role = EXCLUDED.role`,
        [songId, artistId, role]
      );

      return true;
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
  static async removeArtist(artistId: UUID, songId: UUID): Promise<boolean> {
    try {
      const res = await query(
        `DELETE FROM song_artists
        WHERE song_id = $1 AND artist_id = $2`,
        [songId, artistId]
      );

      if (res.length === 0) return false;

      return true;
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
   * Fetches albums for a given song.
   * @param songId The ID of the song.
   * @param options Options for pagination and including related data.
   * @param options.includeArtist Option to include the artist data.
   * @param options.includeLikes Option to include the like count.
   * @param options.includeRuntime Option to include the total runtime of the album.
   * @param options.includeSongCount Option to include the total number of songs on the album.
   * @param options.orderBy Object specifying the column and direction to order by.
   * @param options.orderBy.column The column to order by.
   * @param options.orderBy.direction The direction to order by (ASC or DESC).
   * @param options.limit Maximum number of albums to return.
   * @param options.offset Number of albums to skip.
   * @returns A list of albums that contain the song.
   * @throws Error if the operation fails.
   */
  static async getAlbums(
    songId: UUID,
    options?: {
      includeArtist?: boolean;
      includeLikes?: boolean;
      includeRuntime?: boolean;
      includeSongCount?: boolean;
      orderByColumn?:
        | "title"
        | "created_at"
        | "release_date"
        | "likes"
        | "runtime"
        | "songCount";
      orderByDirection?: "ASC" | "DESC";
      limit?: number;
      offset?: number;
    }
  ): Promise<Album[]> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      const orderByColumn = options?.orderByColumn ?? "created_at";
      const orderByDirection = options?.orderByDirection ?? "DESC";

      const orderByMap: Record<string, string> = {
        title: "a.title",
        created_at: "a.created_at",
        release_date: "a.release_date",
        likes: "likes",
        runtime: "runtime",
        songCount: "song_count",
      };

      const sqlOrderByColumn = orderByMap[orderByColumn];

      const sql = `
        SELECT a.*,
        CASE WHEN $1 THEN 
          (SELECT row_to_json(artist_with_user)
          FROM (
            SELECT ar.*,
              row_to_json(u) AS user
            FROM artists ar
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE ar.id = a.created_by
          ) AS artist_with_user)
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
        JOIN album_songs als ON als.album_id = a.id
        WHERE als.song_id = $5
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $6 OFFSET $7
      `;

      const params = [
        options?.includeArtist ?? false,
        options?.includeLikes ?? false,
        options?.includeRuntime ?? false,
        options?.includeSongCount ?? false,
        songId,
        limit,
        offset,
      ];

      const albums = await query(sql, params);
      if (!albums || albums.length === 0) {
        return [];
      }

      const processedAlbums = await Promise.all(
        albums.map(async (album) => {
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
      console.error("Error fetching albums for song:", error);
      throw error;
    }
  }

  /**
   * Fetches artists for a given song.
   * @param songId - The ID of the song.
   * @param options.includeUser - Option to include the user who created each artist.
   * @param options.orderBy Object specifying the column and direction to order by.
   * @param options.orderBy.column The column to order by.
   * @param options.orderBy.direction The direction to order by (ASC or DESC).
   * @param options.limit - Maximum number of artists to return.
   * @param options.offset - Number of artists to skip.
   * @returns A list of artists associated with the song.
   * @throws Error if the operation fails.
   */
  static async getArtists(
    songId: UUID,
    options?: {
      includeUser?: boolean;
      orderByColumn?: "name" | "created_at" | "verified" | "streams";
      orderByDirection?: "ASC" | "DESC";
      limit?: number;
      offset?: number;
    }
  ): Promise<SongArtist[]> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      const orderByColumn = options?.orderByColumn ?? "created_at";
      const orderByDirection = options?.orderByDirection ?? "DESC";

      const orderByMap: Record<string, string> = {
        name: "a.display_name",
        created_at: "a.created_at",
        verified: "a.verified",
        streams: "streams",
      };

      const sqlOrderByColumn = orderByMap[orderByColumn];

      const sql = `
        SELECT a.*,
          CASE WHEN $1 THEN row_to_json(u.*)
          ELSE NULL END as user,
          COALESCE(SUM(s.streams), 0) as streams
          FROM artists a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN song_artists sa ON a.id = sa.artist_id
        LEFT JOIN songs s ON sa.song_id = s.id
        WHERE sa.song_id = $2
        GROUP BY a.id, u.id
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
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
          artist.type = "artist";
          return artist;
        })
      );

      return processedArtists;
    } catch (error) {
      console.error("Error fetching artists for song:", error);
      throw error;
    }
  }

  static async getSuggestedSongs(
    songId: UUID,
    options?: {
      userId?: UUID;
      includeAlbums?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
      includeComments?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<SuggestedSong[]> {
    try {
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;
      const suggestions = await query(
        "SELECT * FROM get_song_recommendations($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          songId,
          options?.userId || null,
          options?.includeAlbums ?? false,
          options?.includeArtists ?? false,
          options?.includeLikes ?? false,
          options?.includeComments ?? false,
          limit,
          offset,
        ]
      );
      if (!suggestions || suggestions.length === 0) {
        return [];
      }
      const processedSongs = await Promise.all(
        suggestions.map(async (song: SuggestedSong) => {
          if (song.image_url) {
            song.image_url = getBlobUrl(song.image_url);
          }
          if (song.audio_url) {
            song.audio_url = getBlobUrl(song.audio_url);
          }
          if (song.albums && song.albums?.length > 0) {
            song.albums = song.albums.map((album) => {
              if (album.image_url) {
                album.image_url = getBlobUrl(album.image_url);
              }
              if (album.artist) {
                album.artist.type = "artist";
              }
              album.type = "album";
              return album;
            });
          }
          if (song.artists && song.artists?.length > 0) {
            song.artists = song.artists.map((artist) => {
              if (artist.user && artist.user.profile_picture_url) {
                artist.user.profile_picture_url = getBlobUrl(
                  artist.user.profile_picture_url
                );
              }
              artist.type = "artist";
              return artist;
            });
          }
          if (song.main_artist) {
            song.main_artist.type = "artist";
          }
          song.type = "song";
          return song;
        })
      );

      return processedSongs;
    } catch (error) {
      console.error("Error fetching suggested songs:", error);
      throw error;
    }
  }

  static async incrementStreams(songId: UUID): Promise<boolean> {
    try {
      await query(
        `UPDATE songs
        SET streams = streams + 1
        WHERE id = $1`,
        [songId]
      );

      return true;
    } catch (error) {
      console.error("Error incrementing song streams:", error);
      throw error;
    }
  }
}
