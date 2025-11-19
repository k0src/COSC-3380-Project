import {
  Song,
  UUID,
  Album,
  SongArtist,
  SuggestedSong,
  SongOptions,
  AccessContext,
  AlbumOptions,
} from "@types";
import { getAccessPredicate } from "@util";
import { query, withTransaction } from "@config/database";
import { getBlobUrl } from "@config/blobStorage";

export default class SongRepository {
  static async create({
    title,
    owner_id,
    album_id,
    artists,
    duration,
    genre,
    release_date,
    image_url,
    image_url_blurhash,
    audio_url,
    waveform_data,
    visibility_status,
  }: {
    title: string;
    owner_id: UUID;
    album_id?: UUID;
    artists: { id: UUID; role: string }[];
    duration: number;
    genre: string;
    release_date?: string;
    image_url?: string;
    image_url_blurhash?: string;
    audio_url: string;
    waveform_data?: any;
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
            waveform_data,
            visibility_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
            waveform_data ? JSON.stringify(waveform_data) : null,
            visibility_status,
          ]
        );

        const songId = insert.rows[0].id;
        for (const artist of artists) {
          await client.query(
            `INSERT INTO song_artists (song_id, artist_id, role)
            VALUES ($1, $2, $3)`,
            [songId, artist.id, artist.role]
          );
        }

        if (album_id) {
          const maxTrackNumberRes = await client.query(
            `SELECT COALESCE(MAX(track_number), 0) AS max_track_number
            FROM album_songs
            WHERE album_id = $1`,
            [album_id]
          );

          const nextTrackNumber =
            maxTrackNumberRes.rows[0].max_track_number + 1;

          await client.query(
            `INSERT INTO album_songs (album_id, song_id, track_number)
            VALUES ($1, $2, $3)`,
            [album_id, songId, nextTrackNumber]
          );

          if (!image_url) {
            await client.query(
              `UPDATE songs
              SET (image_url, image_url_blurhash) = (
                SELECT image_url, image_url_blurhash 
                FROM albums 
                WHERE id = $1
              )
              WHERE id = $2`,
              [album_id, songId]
            );
          }
        }

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
      waveform_data,
      visibility_status,
    }: {
      title?: string;
      duration?: number;
      genre?: string;
      release_date?: string;
      image_url?: string;
      image_url_blurhash?: string;
      audio_url?: string;
      waveform_data?: any;
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
      if (waveform_data !== undefined) {
        fields.push(`waveform_data = $${values.length + 1}`);
        values.push(JSON.stringify(waveform_data));
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

  static async getOne(
    id: UUID,
    accessContext: AccessContext,
    options?: SongOptions
  ): Promise<Song | null> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "s", 1);

      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const selectFields: string[] = ["s.*"];

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

      if (options?.includeComments) {
        selectFields.push(
          `(SELECT COUNT(*) FROM comments c WHERE c.song_id = s.id) AS comments`
        );
      }

      selectFields.push(
        `EXISTS (SELECT 1 FROM trending_songs ts WHERE ts.song_id = s.id) AS is_trending`
      );

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM songs s
        WHERE s.id = $1 AND (${predicateSql})
        LIMIT 1
      `;

      const params = [id, ...predicateParams];

      const res = await query(sql, params);
      if (!res || res.length === 0) return null;

      const song: Song = res[0];

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
    } catch (error) {
      console.error("Error fetching song:", error);
      throw error;
    }
  }

  static async getMany(
    accessContext: AccessContext,
    options?: SongOptions
  ): Promise<Song[]> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "s");

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
        title: "s.title",
        created_at: "s.created_at",
        streams: "s.streams",
        release_date: "s.release_date",
        likes: "likes",
        comments: "comments",
        duration: "s.duration",
      };

      const sqlOrderByColumn = orderByMap[orderByColumn] ?? "s.created_at";

      const selectFields: string[] = ["s.*"];

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

      if (options?.includeComments) {
        selectFields.push(
          `(SELECT COUNT(*) FROM comments c WHERE c.song_id = s.id) AS comments`
        );
      }

      selectFields.push(
        `EXISTS (SELECT 1 FROM trending_songs ts WHERE ts.song_id = s.id) AS is_trending`
      );

      const limitIndex = predicateParams.length + 1;
      const offsetIndex = predicateParams.length + 2;

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM songs s
        WHERE ${predicateSql}
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const params = [...predicateParams, limit, offset];

      const songs = await query(sql, params);
      if (!songs || songs.length === 0) return [];

      return songs.map((song: Song) => {
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
      console.error("Error fetching songs:", error);
      throw error;
    }
  }

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

  static async count(): Promise<number> {
    try {
      const res = await query("SELECT COUNT(*) FROM songs");
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting songs:", error);
      throw error;
    }
  }

  static async getAlbums(
    songId: UUID,
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

      const songIdIndex = predicateParams.length + 1;
      const limitIndex = predicateParams.length + 2;
      const offsetIndex = predicateParams.length + 3;

      const sql = `
      SELECT ${selectFields.join(",\n")}
      FROM albums a
      JOIN album_songs als ON als.album_id = a.id
      WHERE (${predicateSql}) AND als.song_id = $${songIdIndex}
      ORDER BY ${sqlOrderByColumn} ${orderByDirection}
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

      const params = [...predicateParams, songId, limit, offset];

      const albums = await query(sql, params);
      if (!albums || albums.length === 0) return [];

      return albums.map((album: Album) => {
        if (album.image_url) album.image_url = getBlobUrl(album.image_url);
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
      console.error("Error fetching albums for song:", error);
      throw error;
    }
  }

  //! add accessContext
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

  // already gets only public songs. can add accessContext later if needed
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

  static async getCoverImage(songId: UUID): Promise<string | null> {
    try {
      const res = await query(`SELECT image_url FROM songs WHERE id = $1`, [
        songId,
      ]);
      if (!res || res.length === 0) return null;
      const imageUrl = res[0].image_url;
      return imageUrl ? getBlobUrl(imageUrl) : null;
    } catch (error) {
      console.error("Error fetching cover image:", error);
      throw error;
    }
  }
}
