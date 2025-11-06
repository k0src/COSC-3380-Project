import { Album, Artist, ArtistSong, Song, UUID } from "@types";
import { query, withTransaction } from "@config/database";
import { getBlobUrl } from "@config/blobStorage";

export default class ArtistRepository {
  /**
   * Creates a new artist.
   * @param artistData The data for the new artist.
   * @param artist.display_name The display name of the artist.
   * @param artist.bio The bio of the artist (optional).
   * @param artist.location The location of the artist (optional).
   * @param artist.banner_image_url The banner image URL of the artist (optional).
   * @param artist.user_id The user ID associated with the artist.
   * @returns The created artist, or null if creation fails.
   * @throws Error if the operation fails.
   */
  static async create({
    display_name,
    bio,
    location,
    banner_image_url,
    user_id,
  }: {
    display_name: string;
    bio?: string;
    location?: string;
    banner_image_url?: string;
    user_id: UUID;
  }): Promise<Artist | null> {
    try {
      const res = await query(
        `INSERT INTO artists 
          (display_name, bio, location, banner_image_url, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [display_name, bio, location, banner_image_url, user_id]
      );

      return res[0] ?? null;
    } catch (error) {
      console.error("Error creating artist:", error);
      throw error;
    }
  }

  /**
   * Updates a artist.
   * @param id The ID of the artist to update.
   * @param artistData The new data for the artist.
   * @param artist.display_name The new display name of the artist (optional).
   * @param artist.bio The new bio of the artist (optional).
   * @param artist.location The new location of the artist (optional).
   * @param artist.banner_image_url The new banner image URL of the artist (optional).
   * @param artist.user_id The new user ID associated with the artist (optional).
   * @returns The updated artist, or null if the update fails.
   * @throws Error if the operation fails.
   */
  static async update(
    id: UUID,
    {
      display_name,
      bio,
      location,
      banner_image_url,
      user_id,
    }: {
      display_name?: string;
      bio?: string;
      location?: string;
      banner_image_url?: string;
      user_id?: UUID;
    }
  ): Promise<Artist | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (display_name !== undefined) {
        fields.push(`display_name = $${values.length + 1}`);
        values.push(display_name);
      }
      if (bio !== undefined) {
        fields.push(`bio = $${values.length + 1}`);
        values.push(bio);
      }
      if (location !== undefined) {
        fields.push(`location = $${values.length + 1}`);
        values.push(location);
      }
      if (banner_image_url !== undefined) {
        fields.push(`banner_image_url = $${values.length + 1}`);
        values.push(banner_image_url);
      }
      if (user_id !== undefined) {
        fields.push(`user_id = $${values.length + 1}`);
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
      const sql = `
        SELECT a.*,
        CASE WHEN $1 THEN row_to_json(u.*) 
        ELSE NULL END as user
        FROM artists a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.id = $2`;

      const params = [options?.includeUser ?? false, id];

      const res = await query(sql, params);
      if (!res || res.length === 0) {
        return null;
      }

      const artist: Artist = res[0];
      if (artist.user && artist.user.profile_picture_url) {
        artist.user.profile_picture_url = getBlobUrl(
          artist.user.profile_picture_url
        );
      }
      if (artist.banner_image_url) {
        artist.banner_image_url = getBlobUrl(artist.banner_image_url);
      }

      artist.type = "artist";
      return artist;
    } catch (error) {
      console.error("Error fetching artist:", error);
      throw error;
    }
  }

  /**
   * Fetches multiple artists.
   * @param options Options for pagination and including related data.
   * @param options.includeUser Option to include the user who created each artist.
   * @param options.orderBy Object specifying the column and direction to order by.
   * @param options.orderBy.column The column to order by.
   * @param options.orderBy.direction The direction to order by (ASC or DESC).
   * @param options.limit Maximum number of artists to return.
   * @param options.offset Number of artists to skip.
   * @returns A list of artists.
   * @throws Error if the operation fails.
   */
  static async getMany(options?: {
    includeUser?: boolean;
    orderByColumn?: "name" | "created_at" | "verified" | "streams";
    orderByDirection?: "ASC" | "DESC";
    limit?: number;
    offset?: number;
  }): Promise<Artist[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
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
        GROUP BY a.id, u.id
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const params = [options?.includeUser ?? false, limit, offset];

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
      console.error("Error fetching artists:", error);
      throw error;
    }
  }

  /**
   * Fetches songs for a given artist.
   * @param artistId The ID of the artist.
   * @param options Options for pagination and related data.
   * @param options.includeArtists Option to include the artists data.
   * @param options.includeAlbums Option to include the albums data.
   * @param options.onlySingles Option to include only singles.
   * @param options.includeArtists Option to include the artists data.
   * @param options.includeLikes Option to include the like count.
   * @param options.includeComments Option to include the comment count.
   * @param options.orderBy Object specifying the column and direction to order by.
   * @param options.orderBy.column The column to order by.
   * @param options.orderBy.direction The direction to order by (ASC or DESC).
   * @param options.limit Maximum number of songs to return.
   * @param options.offset Number of songs to skip.
   * @returns A list of songs in the artist's catalog.
   * @throws Error if the operation fails.
   */
  static async getSongs(
    artistId: UUID,
    options?: {
      includeArtists?: boolean;
      includeAlbums?: boolean;
      onlySingles?: boolean;
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
    }
  ): Promise<ArtistSong[]> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      const orderByColumn = options?.orderByColumn ?? "created_at";
      const orderByDirection = options?.orderByDirection ?? "DESC";
      const onlySingles = options?.onlySingles ?? false;

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
      const singlesFilter = onlySingles
        ? "AND NOT EXISTS (SELECT 1 FROM album_songs als WHERE als.song_id = s.id)"
        : "";

      const sql = `
        SELECT s.*, sa.role,
          CASE WHEN $1 THEN 
            (SELECT json_agg(row_to_json(ar_with_role))
            FROM (
              SELECT
                ar.*,
                sa2.role,
                row_to_json(u) AS user
              FROM artists ar
              JOIN users u ON u.artist_id = ar.id
              JOIN song_artists sa2 ON sa2.artist_id = ar.id
              WHERE sa2.song_id = s.id
            ) AS ar_with_role)
          ELSE NULL END AS artists,
          CASE WHEN $2 THEN
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
          CASE WHEN $3 THEN 
            (SELECT COUNT(*) FROM song_likes sl WHERE sl.song_id = s.id) 
          ELSE NULL END as likes
        FROM songs s
        JOIN song_artists sa ON sa.song_id = s.id
        WHERE sa.artist_id = $4
        ${singlesFilter}
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $5 OFFSET $6
      `;

      const params = [
        options?.includeArtists ?? false,
        options?.includeAlbums ?? false,
        options?.includeLikes ?? false,
        artistId,
        limit,
        offset,
      ];

      const songs = await query(sql, params);
      if (!songs || songs.length === 0) {
        return [];
      }

      const processedSongs = await Promise.all(
        songs.map(async (song: ArtistSong) => {
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
      console.error("Error fetching songs for artist:", error);
      throw error;
    }
  }

  /**
   * Fetches albums for a given artist.
   * @param artistId The ID of the artist.
   * @param options Options for pagination and related data.
   * @param options.includeLikes Option to include the like count.
   * @param options.includeRuntime Option to include the total runtime of the album.
   * @param options.includeSongCount Option to include the total number of songs on the album.
   * @param options.orderBy Object specifying the column and direction to order by.
   * @param options.orderBy.column The column to order by.
   * @param options.orderBy.direction The direction to order by (ASC or DESC).
   * @param options.limit Maximum number of albums to return.
   * @param options.offset Number of albums to skip.
   * @returns A list of albums by the artist.
   * @throws Error if the operation fails.
   */
  static async getAlbums(
    artistId: UUID,
    options?: {
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
        CASE WHEN $1 THEN (SELECT COUNT(*) FROM album_likes al 
          WHERE al.album_id = a.id)
        ELSE NULL END as likes,
        CASE WHEN $2 THEN (SELECT SUM(s.duration) FROM songs s
          JOIN album_songs als ON s.id = als.song_id 
          WHERE als.album_id = a.id)
        ELSE NULL END as runtime,
        CASE WHEN $3 THEN (SELECT COUNT(*) FROM album_songs als 
          WHERE als.album_id = a.id)
        ELSE NULL END as song_count
        FROM albums a
        LEFT JOIN artists ar ON a.created_by = ar.id
        WHERE ar.id = $4
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $5 OFFSET $6
      `;

      const params = [
        options?.includeLikes ?? false,
        options?.includeRuntime ?? false,
        options?.includeSongCount ?? false,
        artistId,
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
          album.type = "album";
          return album;
        })
      );

      return processedAlbums;
    } catch (error) {
      console.error("Error fetching albums for artist:", error);
      throw error;
    }
  }

  /**
   * Counts the total number of artists.
   * @return The total number of artists.
   * @throws Error if the operation fails.
   */
  static async count(): Promise<number> {
    try {
      const res = await query("SELECT COUNT(*) FROM artists");
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting artists:", error);
      throw error;
    }
  }

  /**
   * Fetches related artists for a given artist.
   * @param artistId The ID of the artist.
   * @param options Options for pagination and including related data.
   * @param options.includeUser Option to include the user who created each artist.
   * @param options.limit Maximum number of related artists to return.
   * @param options.offset Number of related artists to skip.
   * @return A list of related artists.
   * @throws Error if the operation fails.
   */
  static async getRelatedArtists(
    artistId: UUID,
    options?: {
      includeUser?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Artist[]> {
    try {
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;

      const artists = await query(
        "SELECT * FROM get_related_artists($1, $2, $3, $4)",
        [artistId, options?.includeUser ?? false, limit, offset]
      );

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
      console.error("Error fetching related artists:", error);
      throw error;
    }
  }

  /**
   * Counts the number of songs for a given artist.
   * @param artistId The ID of the artist.
   * @return The number of songs for the artist.
   * @throws Error if the operation fails.
   */
  static async getNumberOfSongs(artistId: UUID): Promise<number> {
    try {
      const res = await query(
        `SELECT COUNT(*) FROM song_artists WHERE artist_id = $1`,
        [artistId]
      );
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting songs for artist:", error);
      throw error;
    }
  }

  /**
   * Counts the number of albums for a given artist.
   * @param artistId The ID of the artist.
   * @return The number of albums for the artist.
   * @throws Error if the operation fails.
   */
  static async getNumberOfAlbums(artistId: UUID): Promise<number> {
    try {
      const res = await query(
        `SELECT COUNT(DISTINCT als.album_id) FROM album_songs als
         JOIN song_artists sa ON als.song_id = sa.song_id
         WHERE sa.artist_id = $1`,
        [artistId]
      );
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting albums for artist:", error);
      throw error;
    }
  }

  /**
   * Counts the number of singles for a given artist.
   * @param artistId The ID of the artist.
   * @return The number of singles for the artist.
   * @throws Error if the operation fails.
   */
  static async getNumberOfSingles(artistId: UUID): Promise<number> {
    try {
      const res = await query(
        `SELECT COUNT(*) FROM song_artists sa
         WHERE sa.artist_id = $1
         AND NOT EXISTS (
          SELECT 1 FROM album_songs als WHERE als.song_id = sa.song_id
         )`,
        [artistId]
      );
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting singles for artist:", error);
      throw error;
    }
  }

  /**
   * Calculates the total number of streams for all songs by a given artist.
   * @param artistId The ID of the artist.
   * @return The total number of streams for the artist's songs.
   * @throws Error if the operation fails.
   */
  static async getTotalStreams(artistId: UUID): Promise<number> {
    try {
      const res = await query(
        `SELECT COALESCE(SUM(s.streams), 0) AS total_streams
         FROM songs s
         JOIN song_artists sa ON s.id = sa.song_id
         WHERE sa.artist_id = $1`,
        [artistId]
      );
      return parseInt(res[0]?.total_streams ?? "0", 10);
    } catch (error) {
      console.error("Error fetching total streams for artist:", error);
      throw error;
    }
  }

  /**
   * Fetches playlists that feature songs by the given artist.
   * @param artistId The ID of the artist.
   * @param options Options for pagination and including related data.
   * @param options.includeUser Option to include the user who created each playlist.
   * @param options.limit Maximum number of playlists to return.
   * @param options.offset Number of playlists to skip.
   * @return A list of playlists featuring the artist's songs.
   * @throws Error if the operation fails.
   */
  static async getPlaylists(
    artistId: UUID,
    options?: {
      includeUser?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    try {
      const playlists = await query(
        `SELECT DISTINCT ON (p.id) p.*,
         CASE WHEN $1 THEN row_to_json(u.*) 
         ELSE NULL END as user,
         (
           SELECT json_agg(image_url)
           FROM (
             SELECT s.image_url
             FROM playlist_songs ps
             JOIN songs s ON ps.song_id = s.id
             WHERE ps.playlist_id = p.id
             AND s.image_url IS NOT NULL
             ORDER BY ps.added_at
             LIMIT 4
           ) AS limited_images
         ) as song_images
         FROM playlists p
         JOIN playlist_songs ps ON p.id = ps.playlist_id
         JOIN songs s ON ps.song_id = s.id
         JOIN song_artists sa ON s.id = sa.song_id
         LEFT JOIN users u ON p.created_by = u.id
         WHERE sa.artist_id = $2
         ORDER BY p.id`,
        [options?.includeUser ?? false, artistId]
      );
      if (!playlists || playlists.length === 0) {
        return [];
      }

      const processedPlaylists = await Promise.all(
        playlists.map(async (playlist) => {
          if (playlist.song_images && playlist.song_images.length > 0) {
            playlist.image_url = `/api/playlists/${playlist.id}/cover-image`;
          }

          delete playlist.song_images;

          playlist.type = "playlist";
          return playlist;
        })
      );

      return processedPlaylists;
    } catch (error) {
      console.error("Error fetching playlists for artist:", error);
      throw error;
    }
  }

  /**
   * Fetches the number of unique monthly listeners for a given artist.
   * @param artistId The ID of the artist.
   * @return The number of unique monthly listeners.
   * @throws Error if the operation fails.
   */
  static async getMonthlyListeners(artistId: UUID): Promise<number> {
    try {
      const res = await query(
        `SELECT listeners_28d AS monthly_listeners
        FROM artist_listeners_28d_daily
        WHERE artist_id = $1
        ORDER BY day DESC
        LIMIT 1`,
        [artistId]
      );
      return parseInt(res[0]?.monthly_listeners ?? "0", 10);
    } catch (error) {
      console.error("Error fetching monthly listeners for artist:", error);
      throw error;
    }
  }
}
