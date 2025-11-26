import {
  Song,
  UUID,
  SuggestedSong,
  AccessContext,
  SongOrderByColumn,
  OrderByDirection,
} from "@types";
import {
  getVisibilityCondition,
  getUserVisibilityCondition,
  notDeletedCondition,
  isDeleted,
} from "@util";
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
      if (!owner_id) {
        throw new Error("Owner ID is required");
      }
      const ownerDeleted = await isDeleted(owner_id, "user");
      if (ownerDeleted) {
        throw new Error("Cannot create song for a deleted user.");
      }

      if (artists) {
        for (const artist of artists) {
          if (!artist.id) {
            throw new Error("Artist ID is required");
          }
          const artistDeleted = await isDeleted(artist.id, "artist");
          if (artistDeleted) {
            throw new Error("Cannot add deleted artist to a song.");
          }
        }
      }

      if (album_id) {
        const albumDeleted = await isDeleted(album_id, "album");
        if (albumDeleted) {
          throw new Error("Cannot add song to a deleted album.");
        }
      }

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
      owner_id,
      title,
      duration,
      genre,
      release_date,
      image_url,
      image_url_blurhash,
      audio_url,
      waveform_data,
      visibility_status,
      album_id,
      artists,
    }: {
      owner_id: UUID;
      title?: string;
      duration?: number;
      genre?: string;
      release_date?: string;
      image_url?: string;
      image_url_blurhash?: string;
      audio_url?: string;
      waveform_data?: any;
      visibility_status?: string;
      album_id?: UUID | null;
      artists?: { id: UUID; role: string }[];
    }
  ): Promise<Song | null> {
    try {
      if (!owner_id) {
        throw new Error("Owner ID is required");
      }
      const ownerDeleted = await isDeleted(owner_id, "user");
      if (ownerDeleted) {
        throw new Error("Cannot update song for a deleted user.");
      }

      const songDeleted = await isDeleted(id, "song");
      if (songDeleted) {
        throw new Error("Cannot update a deleted song.");
      }

      if (artists) {
        for (const artist of artists) {
          if (!artist.id) {
            throw new Error("Artist ID is required");
          }
          const artistDeleted = await isDeleted(artist.id, "artist");
          if (artistDeleted) {
            throw new Error("Cannot add deleted artist to a song.");
          }
        }
      }

      if (album_id) {
        const albumDeleted = await isDeleted(album_id, "album");
        if (albumDeleted) {
          throw new Error("Cannot add song to a deleted album.");
        }
      }

      if (
        title !== undefined &&
        (typeof title !== "string" || title.trim() === "")
      ) {
        throw new Error("Song title cannot be empty");
      }

      const res = await withTransaction(async (client) => {
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
        if (
          fields.length === 0 &&
          artists === undefined &&
          album_id === undefined
        ) {
          throw new Error("No fields to update");
        }

        values.push(id);

        let updateRes;

        if (fields.length > 0) {
          const sql = `UPDATE songs SET ${fields.join(", ")} WHERE id = $${
            values.length
          } RETURNING *`;
          updateRes = await client.query(sql, values);
        } else {
          updateRes = await client.query(`SELECT * FROM songs WHERE id = $1`, [
            id,
          ]);
        }

        const song = updateRes.rows[0];
        if (!song) return null;

        if (artists !== undefined) {
          await client.query(
            `DELETE FROM song_artists WHERE song_id = $1 AND role != 'Main'`,
            [id]
          );

          for (const artist of artists) {
            await client.query(
              `INSERT INTO song_artists (song_id, artist_id, role)
              VALUES ($1, $2, $3)`,
              [id, artist.id, artist.role]
            );
          }
        }

        if (album_id !== undefined) {
          await client.query(`DELETE FROM album_songs WHERE song_id = $1`, [
            id,
          ]);

          if (album_id) {
            const maxTrackNumberRes = await client.query(
              `SELECT COALESCE(MAX(track_number), 0) AS max_track_number
              FROM album_songs
              WHERE album_id = $1`,
              [album_id]
            );

            const nextTrackNumber =
              maxTrackNumberRes?.rows[0]?.max_track_number !== undefined
                ? maxTrackNumberRes.rows[0].max_track_number + 1
                : 1;

            await client.query(
              `INSERT INTO album_songs (album_id, song_id, track_number)
              VALUES ($1, $2, $3)`,
              [album_id, id, nextTrackNumber]
            );
          }
        }

        return song;
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

  static async delete(id: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO deleted_songs
          (song_id, deleted_at) VALUES ($1, NOW())`,
          [id]
        );
      });
    } catch (error) {
      console.error("Error deleting song:", error);
      throw error;
    }
  }

  static async bulkDelete(songIds: UUID[]) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO deleted_songs
          (song_id, deleted_at)
          SELECT id, NOW() FROM songs WHERE id = ANY($1)`,
          [songIds]
        );
      });
    } catch (error) {
      console.error("Error bulk deleting songs:", error);
      throw error;
    }
  }

  static async getSongDetails(
    id: UUID,
    accessContext: AccessContext
  ): Promise<Song | null> {
    try {
      const songVisibility = getVisibilityCondition(
        "s",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const albumVisibility = getVisibilityCondition(
        "a",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const sql = `
        SELECT 
          s.*,
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'title', a.title,
                'image_url', a.image_url,
                'image_url_blurhash', a.image_url_blurhash,
                'owner_id', a.owner_id,
                'visibility_status', a.visibility_status,
                'release_date', a.release_date,
                'genre', a.genre,
                'created_at', a.created_at,
                'created_by', a.created_by,
                'updated_at', a.updated_at,
                'type', 'album',
                'artist', json_build_object(
                  'id', ar.id,
                  'display_name', ar.display_name,
                  'bio', ar.bio,
                  'user_id', ar.user_id,
                  'verified', ar.verified,
                  'location', ar.location,
                  'banner_image_url', ar.banner_image_url,
                  'banner_image_url_blurhash', ar.banner_image_url_blurhash,
                  'created_at', ar.created_at,
                  'updated_at', ar.updated_at,
                  'type', 'artist'
                )
              )
            )
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar ON ar.id = a.created_by
            WHERE als.song_id = s.id
              AND ${notDeletedCondition("album", "a")}
              AND ${albumVisibility}
              AND (ar.id IS NULL OR ${notDeletedCondition("artist", "ar")})
          ) AS albums,
          (
            SELECT json_agg(
              json_build_object(
                'id', ar.id,
                'display_name', ar.display_name,
                'bio', ar.bio,
                'user_id', ar.user_id,
                'verified', ar.verified,
                'location', ar.location,
                'banner_image_url', ar.banner_image_url,
                'banner_image_url_blurhash', ar.banner_image_url_blurhash,
                'created_at', ar.created_at,
                'updated_at', ar.updated_at,
                'role', sa.role,
                'type', 'artist',
                'user', json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'email', u.email,
                  'profile_picture_url', u.profile_picture_url,
                  'pfp_blurhash', u.pfp_blurhash,
                  'role', u.role,
                  'is_private', u.is_private,
                  'status', u.status,
                  'artist_id', u.artist_id,
                  'created_at', u.created_at,
                  'updated_at', u.updated_at
                )
              )
            )
            FROM song_artists sa
            JOIN artists ar ON ar.id = sa.artist_id
            JOIN users u ON u.id = ar.user_id
            WHERE sa.song_id = s.id
              AND ${notDeletedCondition("artist", "ar")}
              AND ${notDeletedCondition("user", "u")}
              AND ${userVisibility}
          ) AS artists,
          (
            SELECT COUNT(*)
            FROM song_likes sl
            WHERE sl.song_id = s.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM comments c
            WHERE c.song_id = s.id
              AND ${notDeletedCondition("comment", "c")}
          ) AS comments,
          EXISTS (
            SELECT 1 
            FROM trending_songs ts 
            WHERE ts.song_id = s.id
          ) AS is_trending
        FROM songs s
        WHERE s.id = $1
          AND ${notDeletedCondition("song", "s")}
          AND ${songVisibility}
        LIMIT 1
      `;

      const res = await query(sql, [id]);

      if (!res || res.length === 0) {
        return null;
      }

      const song: Song = res[0];

      if (song.image_url) {
        song.image_url = getBlobUrl(song.image_url);
      }
      if (song.audio_url) {
        song.audio_url = getBlobUrl(song.audio_url);
      }

      if (song.albums?.length) {
        song.albums.forEach((album) => {
          if (album.image_url) {
            album.image_url = getBlobUrl(album.image_url);
          }
          if (album.artist?.banner_image_url) {
            album.artist.banner_image_url = getBlobUrl(
              album.artist.banner_image_url
            );
          }
        });
      }

      if (song.artists?.length) {
        song.artists.forEach((artist) => {
          if (artist.banner_image_url) {
            artist.banner_image_url = getBlobUrl(artist.banner_image_url);
          }
          if (artist.user?.profile_picture_url) {
            artist.user.profile_picture_url = getBlobUrl(
              artist.user.profile_picture_url
            );
          }
        });
      }

      song.type = "song";

      return song;
    } catch (error) {
      console.error("Error fetching song details:", error);
      throw error;
    }
  }

  static async getManySongs(
    accessContext: AccessContext,
    options?: {
      orderByColumn?: SongOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Song[]> {
    try {
      const songVisibility = getVisibilityCondition(
        "s",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const albumVisibility = getVisibilityCondition(
        "a",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "created_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<SongOrderByColumn, string> = {
        title: "s.title",
        created_at: "s.created_at",
        streams: "s.streams",
        release_date: "s.release_date",
        likes: "likes",
        comments: "comments",
        duration: "s.duration",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          s.*,
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'title', a.title,
                'image_url', a.image_url,
                'image_url_blurhash', a.image_url_blurhash,
                'owner_id', a.owner_id,
                'visibility_status', a.visibility_status,
                'release_date', a.release_date,
                'genre', a.genre,
                'created_at', a.created_at,
                'created_by', a.created_by,
                'updated_at', a.updated_at,
                'type', 'album',
                'artist', json_build_object(
                  'id', ar.id,
                  'display_name', ar.display_name,
                  'bio', ar.bio,
                  'user_id', ar.user_id,
                  'verified', ar.verified,
                  'location', ar.location,
                  'banner_image_url', ar.banner_image_url,
                  'banner_image_url_blurhash', ar.banner_image_url_blurhash,
                  'created_at', ar.created_at,
                  'updated_at', ar.updated_at,
                  'type', 'artist'
                )
              )
            )
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar ON ar.id = a.created_by
            WHERE als.song_id = s.id
              AND ${notDeletedCondition("album", "a")}
              AND ${albumVisibility}
              AND (ar.id IS NULL OR ${notDeletedCondition("artist", "ar")})
          ) AS albums,
          (
            SELECT json_agg(
              json_build_object(
                'id', ar.id,
                'display_name', ar.display_name,
                'bio', ar.bio,
                'user_id', ar.user_id,
                'verified', ar.verified,
                'location', ar.location,
                'banner_image_url', ar.banner_image_url,
                'banner_image_url_blurhash', ar.banner_image_url_blurhash,
                'created_at', ar.created_at,
                'updated_at', ar.updated_at,
                'role', sa.role,
                'type', 'artist',
                'user', json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'email', u.email,
                  'profile_picture_url', u.profile_picture_url,
                  'pfp_blurhash', u.pfp_blurhash,
                  'role', u.role,
                  'is_private', u.is_private,
                  'status', u.status,
                  'artist_id', u.artist_id,
                  'created_at', u.created_at,
                  'updated_at', u.updated_at
                )
              )
            )
            FROM song_artists sa
            JOIN artists ar ON ar.id = sa.artist_id
            JOIN users u ON u.id = ar.user_id
            WHERE sa.song_id = s.id
              AND ${notDeletedCondition("artist", "ar")}
              AND ${notDeletedCondition("user", "u")}
              AND ${userVisibility}
          ) AS artists,
          (
            SELECT COUNT(*)
            FROM song_likes sl
            WHERE sl.song_id = s.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM comments c
            WHERE c.song_id = s.id
              AND ${notDeletedCondition("comment", "c")}
          ) AS comments,
          EXISTS (
            SELECT 1 
            FROM trending_songs ts 
            WHERE ts.song_id = s.id
          ) AS is_trending
          
        FROM songs s
        WHERE ${notDeletedCondition("song", "s")}
          AND ${songVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $1 OFFSET $2
      `;

      const res = await query(sql, [limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const songs: Song[] = res.map((song: Song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }

        if (song.albums?.length) {
          song.albums.forEach((album) => {
            if (album.image_url) {
              album.image_url = getBlobUrl(album.image_url);
            }
            if (album.artist?.banner_image_url) {
              album.artist.banner_image_url = getBlobUrl(
                album.artist.banner_image_url
              );
            }
          });
        }

        if (song.artists?.length) {
          song.artists.forEach((artist) => {
            if (artist.banner_image_url) {
              artist.banner_image_url = getBlobUrl(artist.banner_image_url);
            }
            if (artist.user?.profile_picture_url) {
              artist.user.profile_picture_url = getBlobUrl(
                artist.user.profile_picture_url
              );
            }
          });
        }

        song.type = "song";

        return song;
      });

      return songs;
    } catch (error) {
      console.error("Error fetching songs:", error);
      throw error;
    }
  }

  static async getSuggestedSongs(
    songId: UUID,
    options?: {
      userId?: UUID;
      limit?: number;
      offset?: number;
    }
  ): Promise<SuggestedSong[]> {
    try {
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;
      const suggestions = await query(
        "SELECT * FROM get_song_recommendations($1, $2, $3, $4, $5, $6, $7, $8)",
        [songId, options?.userId || null, true, true, true, true, limit, offset]
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
        WHERE id = $1 AND NOT EXISTS (
          SELECT 1 FROM deleted_songs ds WHERE ds.song_id = songs.id
        )`,
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
      const res = await query(
        `SELECT image_url FROM songs
        WHERE id = $1
        AND NOT EXISTS (
          SELECT 1 FROM deleted_songs ds WHERE ds.song_id = songs.id
        )`,
        [songId]
      );
      if (!res || res.length === 0) return null;
      const imageUrl = res[0].image_url;
      return imageUrl ? getBlobUrl(imageUrl) : null;
    } catch (error) {
      console.error("Error fetching cover image:", error);
      throw error;
    }
  }

  static async getTrendingSongs(
    accessContext: AccessContext,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Song[]> {
    try {
      const songVisibility = getVisibilityCondition(
        "s",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const albumVisibility = getVisibilityCondition(
        "a",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const sql = `
        SELECT 
          s.*,
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'title', a.title,
                'image_url', a.image_url,
                'image_url_blurhash', a.image_url_blurhash,
                'owner_id', a.owner_id,
                'visibility_status', a.visibility_status,
                'release_date', a.release_date,
                'genre', a.genre,
                'created_at', a.created_at,
                'created_by', a.created_by,
                'updated_at', a.updated_at,
                'type', 'album',
                'artist', json_build_object(
                  'id', ar.id,
                  'display_name', ar.display_name,
                  'bio', ar.bio,
                  'user_id', ar.user_id,
                  'verified', ar.verified,
                  'location', ar.location,
                  'banner_image_url', ar.banner_image_url,
                  'banner_image_url_blurhash', ar.banner_image_url_blurhash,
                  'created_at', ar.created_at,
                  'updated_at', ar.updated_at,
                  'type', 'artist'
                )
              )
            )
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar ON ar.id = a.created_by
            WHERE als.song_id = s.id
              AND ${notDeletedCondition("album", "a")}
              AND ${albumVisibility}
              AND (ar.id IS NULL OR ${notDeletedCondition("artist", "ar")})
          ) AS albums,
          (
            SELECT json_agg(
              json_build_object(
                'id', ar.id,
                'display_name', ar.display_name,
                'bio', ar.bio,
                'user_id', ar.user_id,
                'verified', ar.verified,
                'location', ar.location,
                'banner_image_url', ar.banner_image_url,
                'banner_image_url_blurhash', ar.banner_image_url_blurhash,
                'created_at', ar.created_at,
                'updated_at', ar.updated_at,
                'role', sa.role,
                'type', 'artist',
                'user', json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'email', u.email,
                  'profile_picture_url', u.profile_picture_url,
                  'pfp_blurhash', u.pfp_blurhash,
                  'role', u.role,
                  'is_private', u.is_private,
                  'status', u.status,
                  'artist_id', u.artist_id,
                  'created_at', u.created_at,
                  'updated_at', u.updated_at
                )
              )
            )
            FROM song_artists sa
            JOIN artists ar ON ar.id = sa.artist_id
            JOIN users u ON u.id = ar.user_id
            WHERE sa.song_id = s.id
              AND ${notDeletedCondition("artist", "ar")}
              AND ${notDeletedCondition("user", "u")}
              AND ${userVisibility}
          ) AS artists,
          (
            SELECT COUNT(*)
            FROM song_likes sl
            WHERE sl.song_id = s.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM comments c
            WHERE c.song_id = s.id
              AND ${notDeletedCondition("comment", "c")}
          ) AS comments,
          EXISTS (
            SELECT 1 
            FROM trending_songs ts 
            WHERE ts.song_id = s.id
          ) AS is_trending
        FROM songs s
        JOIN trending_songs ts ON ts.song_id = s.id
        WHERE ${notDeletedCondition("song", "s")}
          AND ${songVisibility} AND EXISTS (
            SELECT 1 FROM trending_songs ts WHERE ts.song_id = s.id
          )
        ORDER BY ts.trended_at DESC, s.streams DESC
        LIMIT $1 OFFSET $2
      `;

      const res = await query(sql, [limit, offset]);

      if (!res || res.length === 0) {
        return [];
      }

      const songs: Song[] = res.map((song: Song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }

        if (song.albums?.length) {
          song.albums.forEach((album) => {
            if (album.image_url) {
              album.image_url = getBlobUrl(album.image_url);
            }
            if (album.artist?.banner_image_url) {
              album.artist.banner_image_url = getBlobUrl(
                album.artist.banner_image_url
              );
            }
          });
        }

        if (song.artists?.length) {
          song.artists.forEach((artist) => {
            if (artist.banner_image_url) {
              artist.banner_image_url = getBlobUrl(artist.banner_image_url);
            }
            if (artist.user?.profile_picture_url) {
              artist.user.profile_picture_url = getBlobUrl(
                artist.user.profile_picture_url
              );
            }
          });
        }

        song.type = "song";
        return song;
      });

      return songs;
    } catch (error) {
      console.error("Error fetching trending songs:", error);
      throw error;
    }
  }
}
