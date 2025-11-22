import {
  Album,
  Artist,
  ArtistSong,
  SongOptions,
  AlbumOptions,
  PlaylistOptions,
  AccessContext,
  UUID,
  Playlist,
  PlaylistOrderByColumn,
  ArtistAlbum,
} from "@types";
import { query, withTransaction } from "@config/database";
import { getAccessPredicate } from "@util";
import { getBlobUrl } from "@config/blobStorage";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export default class ArtistRepository {
  static async create({
    user_id,
    display_name,
    bio,
    location,
    banner_image_url,
    banner_image_url_blurhash,
  }: {
    user_id: UUID;
    display_name: string;
    bio?: string;
    location?: string;
    banner_image_url?: string;
    banner_image_url_blurhash?: string;
  }): Promise<Artist | null> {
    try {
      if (
        !display_name ||
        typeof display_name !== "string" ||
        display_name.trim() === ""
      ) {
        throw new Error("Artist display name cannot be empty");
      }

      const res = await withTransaction(async (client) => {
        const insert = await client.query(
          `INSERT INTO artists (
            user_id,
            display_name,
            bio,
            location,
            banner_image_url,
            banner_image_url_blurhash 
          )
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING *`,
          [
            user_id,
            display_name,
            bio,
            location,
            banner_image_url,
            banner_image_url_blurhash,
          ]
        );
        return insert.rows[0] ?? null;
      });

      if (res) {
        if (res.banner_image_url) {
          res.banner_image_url = getBlobUrl(res.banner_image_url);
        }
        res.type = "artist";
      }

      return res;
    } catch (error) {
      console.error("Error creating artist:", error);
      throw error;
    }
  }

  static async update(
    id: UUID,
    {
      display_name,
      bio,
      location,
      banner_image_url,
      banner_image_url_blurhash,
    }: {
      display_name?: string;
      bio?: string;
      location?: string;
      banner_image_url?: string;
      banner_image_url_blurhash?: string;
    }
  ): Promise<Artist | null> {
    try {
      if (
        display_name !== undefined &&
        (typeof display_name !== "string" || display_name.trim() === "")
      ) {
        throw new Error("Artist display name cannot be empty");
      }

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
      if (banner_image_url_blurhash !== undefined) {
        fields.push(`banner_image_url_blurhash = $${values.length + 1}`);
        values.push(banner_image_url_blurhash);
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
        return result.rows[0] ?? null;
      });

      if (res) {
        if (res.banner_image_url) {
          res.banner_image_url = getBlobUrl(res.banner_image_url);
        }
        res.type = "artist";
      }

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

  static async getSongs(
    artistId: UUID,
    accessContext: AccessContext,
    options?: SongOptions
  ): Promise<ArtistSong[]> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "s");
      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const onlySingles = options?.onlySingles ?? false;

      const orderByColumn = options?.orderByColumn ?? "created_at";
      const orderByDirection =
        (options?.orderByDirection ?? "DESC").toUpperCase() === "ASC"
          ? "ASC"
          : "DESC";

      const orderByMap: Record<string, string> = {
        title: "s.title",
        created_at: "s.created_at",
        streams: "s.streams",
        release_date: "s.release_date",
        likes: "likes",
        comments: "comments",
        duration: "s.duration",
      };

      const sqlOrderByColumn = orderByMap[orderByColumn] ?? "s.created_at";

      const singlesFilter = onlySingles
        ? "AND NOT EXISTS (SELECT 1 FROM album_songs als WHERE als.song_id = s.id)"
        : "";

      const selectFields: string[] = ["s.*", "sa.role"];

      if (options?.includeArtists) {
        selectFields.push(`
        (
          SELECT json_agg(row_to_json(ar_with_role))
          FROM (
            SELECT ar.*, sa2.role, row_to_json(u) AS user
            FROM artists ar
            JOIN users u ON u.artist_id = ar.id
            JOIN song_artists sa2 ON sa2.artist_id = ar.id
            WHERE sa2.song_id = s.id
          ) AS ar_with_role
        ) AS artists
      `);
      }

      if (options?.includeAlbums) {
        selectFields.push(`
        (
          SELECT json_agg(row_to_json(album_with_artist))
          FROM (
            SELECT a.*, row_to_json(ar) AS artist
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar ON ar.id = a.created_by
            WHERE als.song_id = s.id
          ) AS album_with_artist
        ) AS albums
      `);
      }

      if (options?.includeLikes) {
        selectFields.push(
          `(SELECT COUNT(*) FROM song_likes sl WHERE sl.song_id = s.id) AS likes`
        );
      }

      if (options?.includeComments) {
        selectFields.push(
          `(SELECT COUNT(*) FROM comments c WHERE c.song_id = s.id) AS comments`
        );
      }

      selectFields.push(
        `EXISTS (SELECT 1 FROM trending_songs ts WHERE ts.song_id = s.id) AS is_trending`
      );

      const artistIdIndex = predicateParams.length + 1;
      const limitIndex = predicateParams.length + 2;
      const offsetIndex = predicateParams.length + 3;

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM songs s
        JOIN song_artists sa ON sa.song_id = s.id
        WHERE (${predicateSql})
          AND sa.artist_id = $${artistIdIndex}
          ${singlesFilter}
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const params = [...predicateParams, artistId, limit, offset];

      const songs = await query(sql, params);
      if (!songs || songs.length === 0) return [];

      return songs.map((song: ArtistSong) => {
        if (song.image_url) song.image_url = getBlobUrl(song.image_url);
        if (song.audio_url) song.audio_url = getBlobUrl(song.audio_url);

        if (song.albums?.length) {
          song.albums.forEach((album) => {
            if (album.image_url) album.image_url = getBlobUrl(album.image_url);
            if (album.artist) album.artist.type = "artist";
            album.type = "album";
          });
        }

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
      console.error("Error fetching artist songs:", error);
      throw error;
    }
  }

  static async getAlbums(
    artistId: UUID,
    accessContext: AccessContext,
    options?: AlbumOptions
  ): Promise<ArtistAlbum[]> {
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

      selectFields.push(`
        EXISTS (SELECT 1 FROM artist_page_pinned_albums apa WHERE apa.album_id = a.id) AS is_pinned  
      `);

      const limitIndex = predicateParams.length + 2;
      const offsetIndex = predicateParams.length + 3;

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM albums a
        WHERE (${predicateSql})
          AND a.created_by = $${predicateParams.length + 1}
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const params = [...predicateParams, artistId, limit, offset];

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
      console.error("Error fetching albums for artist:", error);
      throw error;
    }
  }

  static async getArtistPlaylists(
    artistId: UUID,
    accessContext: AccessContext,
    options?: PlaylistOptions
  ): Promise<Playlist[]> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "p");
      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const orderByColumn = options?.orderByColumn ?? "created_at";
      const orderByDirection =
        (options?.orderByDirection ?? "DESC").toUpperCase() === "ASC"
          ? "ASC"
          : "DESC";

      const orderByMap: Record<PlaylistOrderByColumn, string> = {
        title: "p.title",
        created_at: "p.created_at",
        likes: "likes",
        runtime: "runtime",
        songCount: "song_count",
      };

      const sqlOrderByColumn = orderByMap[orderByColumn] ?? "p.created_at";

      const selectFields: string[] = ["p.*"];

      if (options?.includeUser) {
        selectFields.push(`
        (
          SELECT row_to_json(u)
          FROM users u
          WHERE u.id = p.owner_id
        ) AS user
      `);
      }

      if (options?.includeLikes) {
        selectFields.push(`
        (SELECT COUNT(*) FROM playlist_likes pl WHERE pl.playlist_id = p.id) AS likes
      `);
      }

      if (options?.includeSongCount) {
        selectFields.push(`
        (SELECT COUNT(*) FROM playlist_songs ps WHERE ps.playlist_id = p.id) AS song_count
      `);
      }

      if (options?.includeRuntime) {
        selectFields.push(`
        (SELECT COALESCE(SUM(s.duration), 0)
         FROM songs s
         JOIN playlist_songs ps ON ps.song_id = s.id
         WHERE ps.playlist_id = p.id
        ) AS runtime
      `);
      }

      selectFields.push(`
        EXISTS (
          SELECT 1 FROM playlist_songs ps WHERE ps.playlist_id = p.id
        ) AS has_song
      `);

      const artistIdIndex = predicateParams.length + 1;
      const limitIndex = predicateParams.length + 2;
      const offsetIndex = predicateParams.length + 3;

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM playlists p
        JOIN artist_playlists ap ON ap.playlist_id = p.id
        WHERE (${predicateSql}) AND ap.artist_id = $${artistIdIndex}
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const params = [...predicateParams, artistId, limit, offset];

      const rows = await query(sql, params);
      if (!rows || rows.length === 0) return [];

      return rows.map((playlist: Playlist) => {
        if (playlist.user?.profile_picture_url) {
          playlist.user.profile_picture_url = getBlobUrl(
            playlist.user.profile_picture_url
          );
        }

        if (playlist.image_url) {
          playlist.image_url = getBlobUrl(playlist.image_url);
        } else if ((playlist as any).has_song) {
          playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
        }

        delete (playlist as any).has_song;
        playlist.type = "playlist";

        return playlist;
      });
    } catch (error) {
      console.error("Error fetching playlists:", error);
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
        `SELECT COUNT(*) FROM albums a
         WHERE a.created_by = $1`,
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

  //! include cover image - expensive so make it optional
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
        (SELECT EXISTS (
          SELECT 1 FROM playlist_songs ps WHERE ps.playlist_id = p.id
        )) AS has_song
        FROM playlists p
        JOIN playlist_songs ps ON p.id = ps.playlist_id
        JOIN songs s ON ps.song_id = s.id
        JOIN song_artists sa ON s.id = sa.song_id
        LEFT JOIN users u ON p.owner_id = u.id
        WHERE sa.artist_id = $2
         ORDER BY p.id`,
        [options?.includeUser ?? false, artistId]
      );
      if (!playlists || playlists.length === 0) {
        return [];
      }

      const processedPlaylists = await Promise.all(
        playlists.map(async (playlist) => {
          if (playlist.user && playlist.user.profile_picture_url) {
            playlist.user.profile_picture_url = getBlobUrl(
              playlist.user.profile_picture_url
            );
          }

          if (playlist.image_url) {
            playlist.image_url = getBlobUrl(playlist.image_url);
          } else if ((playlist as any).has_song) {
            playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
          }
          delete (playlist as any).has_song;
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

  /**
   * Verifies an artist.
   * @param artistId The ID of the artist to verify.
   * @returns True if the artist was successfully verified.
   * @throws Error if the operation fails.
   */
  static async verifyArtist(artistId: UUID): Promise<boolean> {
    try {
      const res = await query(
        `UPDATE artists SET verified = TRUE 
        WHERE id = $1 
        RETURNING verified`,
        [artistId]
      );

      return res[0]?.verified ?? false;
    } catch (error) {
      console.error("Error verifying artist:", error);
      throw error;
    }
  }

  /**
   * Unverifies an artist.
   * @param artistId The ID of the artist to unverify.
   * @returns True if the artist was successfully unverified.
   * @throws Error if the operation fails.
   */
  static async unverifyArtist(artistId: UUID): Promise<boolean> {
    try {
      const res = await query(
        `UPDATE artists SET verified = FALSE
        WHERE id = $1
        RETURNING verified`,
        [artistId]
      );

      return res[0]?.verified === false;
    } catch (error) {
      console.error("Error unverifying artist:", error);
      throw error;
    }
  }

  static async pinAlbumToArtistPage(artistId: UUID, albumId: UUID) {
    try {
      await query(
        `INSERT INTO artist_page_pinned_albums 
          (artist_id, album_id)
        VALUES ($1, $2)`,
        [artistId, albumId]
      );
    } catch (error) {
      console.error("Error pinning album to artist page:", error);
      throw error;
    }
  }

  static async unPinAlbumFromArtistPage(artistId: UUID, albumId: UUID) {
    try {
      await query(
        `DELETE FROM artist_page_pinned_albums
        WHERE artist_id = $1 AND album_id = $2`,
        [artistId, albumId]
      );
    } catch (error) {
      console.error("Error unpinning album from artist page:", error);
      throw error;
    }
  }

  static async checkArtistHasPlaylists(artistId: UUID): Promise<boolean> {
    try {
      const res = await query(
        `SELECT EXISTS (
          SELECT 1 FROM artist_playlists ap
          WHERE ap.artist_id = $1
        ) AS has_playlists`,
        [artistId]
      );
      return res[0]?.has_playlists ?? false;
    } catch (error) {
      console.error("Error checking if artist has playlists:", error);
      throw error;
    }
  }

  static async checkArtistHasSongs(artistId: UUID): Promise<boolean> {
    try {
      const result = await query(
        `SELECT EXISTS(
          SELECT 1
          FROM song_artists
          WHERE artist_id = $1
        ) AS has_songs`,
        [artistId]
      );

      return result[0]?.has_songs || false;
    } catch (error) {
      console.error("Error checking if artist has songs:", error);
      throw error;
    }
  }

  static async getPinnedAlbum(
    artistId: UUID,
    accessContext: AccessContext,
    options?: AlbumOptions
  ): Promise<ArtistAlbum | null> {
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

      const idIndex = predicateParams.length + 1;

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM albums a
        JOIN artist_page_pinned_albums apa ON apa.album_id = a.id
        WHERE (${predicateSql}) AND apa.artist_id = $${idIndex}
        LIMIT 1
      `;

      const params = [...predicateParams, artistId];

      const res = await query(sql, params);
      if (!res || res.length === 0) return null;

      const album: ArtistAlbum = res[0];

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
      console.error("Error fetching pinned album for artist:", error);
      throw error;
    }
  }
}
