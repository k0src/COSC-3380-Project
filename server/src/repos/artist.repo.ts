import {
  Artist,
  ArtistSong,
  AccessContext,
  UUID,
  Playlist,
  PlaylistOrderByColumn,
  ArtistAlbum,
  Song,
  ArtistOrderByColumn,
  OrderByDirection,
  SongOrderByColumn,
  AlbumOrderByColumn,
} from "@types";
import { query, withTransaction } from "@config/database";
import {
  getUserVisibilityCondition,
  getVisibilityCondition,
  notDeletedCondition,
  isDeleted,
} from "@util";
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
      if (!user_id) {
        throw new Error("User ID is required");
      }
      const userDeleted = await isDeleted(user_id, "user");
      if (userDeleted) {
        throw new Error("Cannot create artist for a deleted user.");
      }

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

        const artistId = insert.rows[0]?.id;
        if (!artistId) {
          throw new Error("Failed to create artist.");
        }

        await client.query(
          `UPDATE users 
          SET artist_id = $1, role = 'ARTIST'
          WHERE id = $2`,
          [artistId, user_id]
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
      user_id,
      display_name,
      bio,
      location,
      banner_image_url,
      banner_image_url_blurhash,
    }: {
      user_id: UUID;
      display_name?: string;
      bio?: string;
      location?: string;
      banner_image_url?: string;
      banner_image_url_blurhash?: string;
    }
  ): Promise<Artist | null> {
    try {
      if (!user_id) {
        throw new Error("User ID is required");
      }

      const userDeleted = await isDeleted(user_id, "user");
      if (userDeleted) {
        throw new Error("Cannot update artist for a deleted user.");
      }

      if (
        display_name !== undefined &&
        (typeof display_name !== "string" || display_name.trim() === "")
      ) {
        throw new Error("Artist display name cannot be empty");
      }

      const res = await withTransaction(async (client) => {
        const deletedCheck = await client.query(
          `SELECT 1 FROM deleted_artists WHERE artist_id = $1`,
          [id]
        );
        if (deletedCheck.rows.length > 0) {
          throw new Error("Cannot update a deleted artist.");
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

  static async delete(id: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO deleted_artists
          (artist_id, deleted_at) VALUES ($1, NOW())`,
          [id]
        );
      });
    } catch (error) {
      console.error("Error deleting artist:", error);
      throw error;
    }
  }

  static async getArtistDetails(
    id: UUID,
    accessContext: AccessContext
  ): Promise<Artist | null> {
    try {
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const sql = `
        SELECT 
          ar.*,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = ar.user_id
                AND ${notDeletedCondition("user", "u")}
                AND ${userVisibility}
            ) AS user_data
          ) AS user
        FROM artists ar
        WHERE ar.id = $1
          AND ${notDeletedCondition("artist", "ar")}
        LIMIT 1
      `;

      const res = await query(sql, [id]);
      if (!res || res.length === 0) {
        return null;
      }

      const artist: Artist = res[0];

      if (artist.banner_image_url) {
        artist.banner_image_url = getBlobUrl(artist.banner_image_url);
      }

      if (artist.user?.profile_picture_url) {
        artist.user.profile_picture_url = getBlobUrl(
          artist.user.profile_picture_url
        );
      }

      artist.type = "artist";
      return artist;
    } catch (error) {
      console.error("Error fetching artist details:", error);
      throw error;
    }
  }

  static async getManyArtists(
    accessContext: AccessContext,
    options?: {
      orderByColumn?: ArtistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Artist[]> {
    try {
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "created_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<ArtistOrderByColumn, string> = {
        display_name: "ar.display_name",
        created_at: "ar.created_at",
        verified: "ar.verified",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          ar.*,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = ar.user_id
                AND ${notDeletedCondition("user", "u")}
                AND ${userVisibility}
            ) AS user_data
          ) AS user
        FROM artists ar
        WHERE ${notDeletedCondition("artist", "ar")}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $1 OFFSET $2
      `;

      const res = await query(sql, [limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const artists: Artist[] = res.map((artist) => {
        if (artist.banner_image_url) {
          artist.banner_image_url = getBlobUrl(artist.banner_image_url);
        }

        if (artist.user?.profile_picture_url) {
          artist.user.profile_picture_url = getBlobUrl(
            artist.user.profile_picture_url
          );
        }

        artist.type = "artist";
        return artist;
      });

      return artists;
    } catch (error) {
      console.error("Error fetching artists:", error);
      throw error;
    }
  }

  static async getSongs(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: SongOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<ArtistSong[]> {
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
          sa.role,
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
                'id', ar2.id,
                'display_name', ar2.display_name,
                'bio', ar2.bio,
                'user_id', ar2.user_id,
                'verified', ar2.verified,
                'location', ar2.location,
                'banner_image_url', ar2.banner_image_url,
                'banner_image_url_blurhash', ar2.banner_image_url_blurhash,
                'created_at', ar2.created_at,
                'updated_at', ar2.updated_at,
                'role', sa2.role,
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
            FROM song_artists sa2
            JOIN artists ar2 ON ar2.id = sa2.artist_id
            JOIN users u ON u.id = ar2.user_id
            WHERE sa2.song_id = s.id
              AND ${notDeletedCondition("artist", "ar2")}
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
        JOIN song_artists sa ON s.id = sa.song_id
        WHERE sa.artist_id = $1
          AND ${notDeletedCondition("song", "s")}
          AND ${songVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [artistId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const songs: ArtistSong[] = res.map((song: ArtistSong) => {
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
      console.error("Error fetching artist songs:", error);
      throw error;
    }
  }

  static async getSingles(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: SongOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<ArtistSong[]> {
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
          sa.role,
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
                'id', ar2.id,
                'display_name', ar2.display_name,
                'bio', ar2.bio,
                'user_id', ar2.user_id,
                'verified', ar2.verified,
                'location', ar2.location,
                'banner_image_url', ar2.banner_image_url,
                'banner_image_url_blurhash', ar2.banner_image_url_blurhash,
                'created_at', ar2.created_at,
                'updated_at', ar2.updated_at,
                'role', sa2.role,
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
            FROM song_artists sa2
            JOIN artists ar2 ON ar2.id = sa2.artist_id
            JOIN users u ON u.id = ar2.user_id
            WHERE sa2.song_id = s.id
              AND ${notDeletedCondition("artist", "ar2")}
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
        JOIN song_artists sa ON s.id = sa.song_id
        WHERE sa.artist_id = $1
          AND ${notDeletedCondition("song", "s")}
          AND ${songVisibility}
          AND NOT EXISTS (
            SELECT 1 FROM album_songs als_single
            WHERE als_single.song_id = s.id
          )
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [artistId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const songs: ArtistSong[] = res.map((song: ArtistSong) => {
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
      console.error("Error fetching artist songs:", error);
      throw error;
    }
  }

  static async getAlbums(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: AlbumOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<ArtistAlbum[]> {
    try {
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

      const orderByMap: Record<AlbumOrderByColumn, string> = {
        title: "a.title",
        created_at: "a.created_at",
        release_date: "a.release_date",
        likes: "likes",
        song_count: "song_count",
        runtime: "runtime",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          a.*,
          (
            SELECT row_to_json(artist_with_user)
            FROM (
              SELECT 
                ar.id,
                ar.display_name,
                ar.bio,
                ar.user_id,
                ar.verified,
                ar.location,
                ar.banner_image_url,
                ar.banner_image_url_blurhash,
                ar.created_at,
                ar.updated_at,
                'artist' AS type,
                row_to_json(u.*) AS user
              FROM artists ar
              LEFT JOIN users u ON u.id = ar.user_id
              WHERE ar.id = a.created_by
                AND ${notDeletedCondition("artist", "ar")}
                AND (u.id IS NULL OR (${notDeletedCondition(
                  "user",
                  "u"
                )} AND ${userVisibility}))
            ) AS artist_with_user
          ) AS artist,
          (
            SELECT COUNT(*)
            FROM album_likes al
            WHERE al.album_id = a.id
          ) AS likes,
          (
            SELECT SUM(s.duration)
            FROM songs s
            JOIN album_songs als ON als.song_id = s.id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT COUNT(*)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT json_agg(als.song_id)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids,
          EXISTS (
            SELECT 1 
            FROM artist_page_pinned_albums apa 
            WHERE apa.album_id = a.id
          ) AS is_pinned
        FROM albums a
        WHERE a.created_by = $1
          AND ${notDeletedCondition("album", "a")}
          AND ${albumVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [artistId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const albums: ArtistAlbum[] = res.map((album) => {
        if (album.image_url) {
          album.image_url = getBlobUrl(album.image_url);
        }

        if (album.artist) {
          if (album.artist.banner_image_url) {
            album.artist.banner_image_url = getBlobUrl(
              album.artist.banner_image_url
            );
          }
          if (album.artist.user?.profile_picture_url) {
            album.artist.user.profile_picture_url = getBlobUrl(
              album.artist.user.profile_picture_url
            );
          }
        }

        album.type = "album";
        return album;
      });

      return albums;
    } catch (error) {
      console.error("Error fetching artist albums:", error);
      throw error;
    }
  }

  static async getArtistPlaylists(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: PlaylistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Playlist[]> {
    try {
      const playlistVisibility = getVisibilityCondition(
        "p",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "created_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<PlaylistOrderByColumn, string> = {
        title: "p.title",
        created_at: "p.created_at",
        likes: "likes",
        runtime: "runtime",
        song_count: "song_count",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          p.*,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = p.owner_id
                AND ${notDeletedCondition("user", "u")}
                AND ${userVisibility}
            ) AS user_data
          ) AS user,
          (
            SELECT COUNT(*)
            FROM playlist_likes pl
            WHERE pl.playlist_id = p.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT COALESCE(SUM(s.duration), 0)
            FROM songs s
            JOIN playlist_songs ps ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT json_agg(ps.song_id ORDER BY ps.position)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids,
          (
            SELECT EXISTS (
              SELECT 1
              FROM playlist_songs ps
              JOIN songs s ON s.id = ps.song_id
              WHERE ps.playlist_id = p.id
                AND ${notDeletedCondition("song", "s")}
            )
          ) AS has_song
        FROM playlists p
        JOIN artist_playlists ap ON ap.playlist_id = p.id
        WHERE ap.artist_id = $1
          AND ${notDeletedCondition("playlist", "p")}
          AND ${playlistVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [artistId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const playlists: Playlist[] = res.map((playlist) => {
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

      return playlists;
    } catch (error) {
      console.error("Error fetching artist playlists:", error);
      throw error;
    }
  }

  static async getRelatedArtists(
    artistId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Artist[]> {
    try {
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;

      const artists = await query(
        "SELECT * FROM get_related_artists($1, $2, $3, $4)",
        [artistId, true, limit, offset]
      );

      if (!artists || artists.length === 0) {
        return [];
      }

      return artists.map((artist: Artist) => {
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
      });
    } catch (error) {
      console.error("Error fetching related artists:", error);
      throw error;
    }
  }

  static async getArtistRecommendations(
    userId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Artist[]> {
    try {
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;

      const recommendations = await query(
        "SELECT * FROM get_artist_recommendations($1, $2, $3, $4)",
        [userId, true, limit, offset]
      );

      if (!recommendations || recommendations.length === 0) return [];
      return recommendations.map((artist: Artist) => {
        if (artist.user) {
          if (artist.user.profile_picture_url) {
            artist.user.profile_picture_url = getBlobUrl(
              artist.user.profile_picture_url
            );
          }
        }
        if (artist.banner_image_url) {
          artist.banner_image_url = getBlobUrl(artist.banner_image_url);
        }
        artist.type = "artist";
        return artist;
      });
    } catch (error) {
      console.error("Error fetching artist recommendations:", error);
      throw error;
    }
  }

  static async getNewFromFollowedArtists(
    userId: UUID,
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
        "al",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "release_date";
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
              'id', al.id,
              'title', al.title,
              'image_url', al.image_url,
              'image_url_blurhash', al.image_url_blurhash,
              'owner_id', al.owner_id,
              'visibility_status', al.visibility_status,
              'release_date', al.release_date,
              'genre', al.genre,
              'created_at', al.created_at,
              'updated_at', al.updated_at,
              'type', 'album',
              'artist', json_build_object(
                'id', ar_album.id,
                'display_name', ar_album.display_name,
                'bio', ar_album.bio,
                'user_id', ar_album.user_id,
                'verified', ar_album.verified,
                'location', ar_album.location,
                'banner_image_url', ar_album.banner_image_url,
                'banner_image_url_blurhash', ar_album.banner_image_url_blurhash,
                'created_at', ar_album.created_at,
                'updated_at', ar_album.updated_at,
                'type', 'artist'
              )
            )
          )
          FROM albums al
          JOIN album_songs als ON als.album_id = al.id
          LEFT JOIN artists ar_album ON ar_album.id = al.created_by
          WHERE als.song_id = s.id
            AND ${notDeletedCondition("album", "al")}
            AND ${albumVisibility}
            AND (ar_album.id IS NULL OR ${notDeletedCondition(
              "artist",
              "ar_album"
            )})
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
              'role', sa2.role,
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
          FROM song_artists sa2
          JOIN artists ar ON ar.id = sa2.artist_id
          JOIN users u ON u.id = ar.user_id
          WHERE sa2.song_id = s.id
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
      JOIN song_artists sa ON sa.song_id = s.id
      JOIN artists a ON a.id = sa.artist_id
      JOIN users u_artist ON u_artist.id = a.user_id
      JOIN user_followers uf ON uf.follower_id = $1 AND uf.following_id = u_artist.id
      WHERE ${notDeletedCondition("song", "s")}
        AND ${notDeletedCondition("artist", "a")}
        AND ${notDeletedCondition("user", "u_artist")}
        AND ${songVisibility}
      GROUP BY s.id
      ORDER BY ${orderBySQL} ${orderByDirection}
      LIMIT $2 OFFSET $3
    `;

      const res = await query(sql, [userId, limit, offset]);
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
      console.error("Error fetching new songs from followed artists:", error);
      throw error;
    }
  }

  static async getPinnedAlbum(
    artistId: UUID,
    accessContext: AccessContext
  ): Promise<ArtistAlbum | null> {
    try {
      const albumVisibility = getVisibilityCondition(
        "a",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const sql = `
        SELECT 
          a.*,
          (
            SELECT row_to_json(artist_with_user)
            FROM (
              SELECT 
                ar.id,
                ar.display_name,
                ar.bio,
                ar.user_id,
                ar.verified,
                ar.location,
                ar.banner_image_url,
                ar.banner_image_url_blurhash,
                ar.created_at,
                ar.updated_at,
                'artist' AS type,
                row_to_json(u.*) AS user
              FROM artists ar
              LEFT JOIN users u ON u.id = ar.user_id
              WHERE ar.id = a.created_by
                AND ${notDeletedCondition("artist", "ar")}
                AND (u.id IS NULL OR (${notDeletedCondition(
                  "user",
                  "u"
                )} AND ${userVisibility}))
            ) AS artist_with_user
          ) AS artist,
          (
            SELECT COUNT(*)
            FROM album_likes al
            WHERE al.album_id = a.id
          ) AS likes,
          (
            SELECT SUM(s.duration)
            FROM songs s
            JOIN album_songs als ON als.song_id = s.id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT COUNT(*)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT json_agg(als.song_id)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids
        FROM albums a
        JOIN artist_page_pinned_albums apa ON apa.album_id = a.id
        WHERE apa.artist_id = $1
          AND ${notDeletedCondition("album", "a")}
          AND ${albumVisibility}
        LIMIT 1
      `;

      const res = await query(sql, [artistId]);

      if (!res || res.length === 0) {
        return null;
      }

      const album: ArtistAlbum = res[0];

      if (album.image_url) {
        album.image_url = getBlobUrl(album.image_url);
      }

      if (album.artist) {
        if (album.artist.banner_image_url) {
          album.artist.banner_image_url = getBlobUrl(
            album.artist.banner_image_url
          );
        }
        if (album.artist.user?.profile_picture_url) {
          album.artist.user.profile_picture_url = getBlobUrl(
            album.artist.user.profile_picture_url
          );
        }
      }

      album.type = "album";
      return album;
    } catch (error) {
      console.error("Error fetching pinned album for artist:", error);
      throw error;
    }
  }

  static async getFeaturedOnPlaylists(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: PlaylistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Playlist[]> {
    try {
      const playlistVisibility = getVisibilityCondition(
        "p",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "created_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<PlaylistOrderByColumn, string> = {
        title: "p.title",
        created_at: "p.created_at",
        likes: "likes",
        runtime: "runtime",
        song_count: "song_count",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT DISTINCT ON (p.id)
          p.*,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = p.owner_id
                AND ${notDeletedCondition("user", "u")}
                AND ${userVisibility}
            ) AS user_data
          ) AS user,
          (
            SELECT COUNT(*)
            FROM playlist_likes pl
            WHERE pl.playlist_id = p.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM playlist_songs ps2
            JOIN songs s2 ON s2.id = ps2.song_id
            WHERE ps2.playlist_id = p.id
              AND ${notDeletedCondition("song", "s2")}
          ) AS song_count,
          (
            SELECT COALESCE(SUM(s2.duration), 0)
            FROM songs s2
            JOIN playlist_songs ps2 ON ps2.song_id = s2.id
            WHERE ps2.playlist_id = p.id
              AND ${notDeletedCondition("song", "s2")}
          ) AS runtime,
          (
            SELECT json_agg(ps2.song_id ORDER BY ps2.position)
            FROM playlist_songs ps2
            JOIN songs s2 ON s2.id = ps2.song_id
            WHERE ps2.playlist_id = p.id
              AND ${notDeletedCondition("song", "s2")}
          ) AS song_ids,
          (
            SELECT EXISTS (
              SELECT 1
              FROM playlist_songs ps2
              JOIN songs s2 ON s2.id = ps2.song_id
              WHERE ps2.playlist_id = p.id
                AND ${notDeletedCondition("song", "s2")}
            )
          ) AS has_song
        FROM playlists p
        JOIN playlist_songs ps ON p.id = ps.playlist_id
        JOIN songs s ON ps.song_id = s.id
        JOIN song_artists sa ON s.id = sa.song_id
        WHERE sa.artist_id = $1
          AND ${notDeletedCondition("playlist", "p")}
          AND ${notDeletedCondition("song", "s")}
          AND ${playlistVisibility}
        ORDER BY p.id, ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [artistId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const playlists: Playlist[] = res.map((playlist) => {
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

      return playlists;
    } catch (error) {
      console.error("Error fetching featured playlists for artist:", error);
      throw error;
    }
  }

  static async getTopArtist(days: number): Promise<Artist | null> {
    try {
      const sql = `
      SELECT 
        a.*,
        (
          SELECT row_to_json(user_data)
          FROM (
            SELECT 
              u.id,
              u.username,
              u.email,
              u.profile_picture_url,
              u.pfp_blurhash,
              u.role,
              u.is_private,
              u.status,
              u.artist_id,
              u.created_at,
              u.updated_at
            FROM users u
            WHERE u.id = a.user_id
              AND ${notDeletedCondition("user", "u")}
              AND NOT u.is_private
          ) AS user_data
        ) AS user,
        (
          SELECT COUNT(DISTINCT sl.user_id)
          FROM song_likes sl
          JOIN song_artists sa ON sl.song_id = sa.song_id
          JOIN songs s ON s.id = sa.song_id
          WHERE sa.artist_id = a.id
            AND sl.liked_at >= NOW() - INTERVAL '${days} days'
            AND ${notDeletedCondition("song", "s")}
        ) AS likes,
        (
          SELECT COUNT(*)
          FROM song_history sh
          JOIN song_artists sa ON sh.song_id = sa.song_id
          JOIN songs s ON s.id = sa.song_id
          WHERE sa.artist_id = a.id
            AND sh.played_at >= NOW() - INTERVAL '${days} days'
            AND ${notDeletedCondition("song", "s")}
        ) AS streams,
        (
          SELECT COUNT(*) 
          FROM user_followers uf
          WHERE uf.following_id = u.id
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du 
              WHERE du.user_id = uf.follower_id
            )
        ) AS followers
      FROM artists a
      JOIN users u ON a.user_id = u.id
      WHERE ${notDeletedCondition("artist", "a")}
      ORDER BY streams DESC, likes DESC, followers DESC
      LIMIT 1
    `;

      const result = await query(sql);
      if (!result || result.length === 0) {
        return null;
      }

      const topArtist: Artist = result[0];

      if (topArtist.banner_image_url) {
        topArtist.banner_image_url = getBlobUrl(topArtist.banner_image_url);
      }

      if (topArtist.user?.profile_picture_url) {
        topArtist.user.profile_picture_url = getBlobUrl(
          topArtist.user.profile_picture_url
        );
      }

      topArtist.type = "artist";
      return topArtist;
    } catch (error) {
      console.error("Error fetching top artist:", error);
      throw error;
    }
  }

  static async getNumberOfSongs(artistId: UUID): Promise<number> {
    try {
      const artistDeleted = await isDeleted(artistId, "artist");
      if (artistDeleted) {
        throw new Error("Artist is deleted.");
      }

      const sql = `
        SELECT COUNT(*) 
        FROM song_artists sa
        JOIN songs s ON s.id = sa.song_id
        WHERE sa.artist_id = $1
          AND ${notDeletedCondition("song", "s")}
      `;

      const res = await query(sql, [artistId]);
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting songs for artist:", error);
      throw error;
    }
  }

  static async getTotalStreams(artistId: UUID): Promise<number> {
    try {
      const artistDeleted = await isDeleted(artistId, "artist");
      if (artistDeleted) {
        throw new Error("Artist is deleted.");
      }

      const sql = `
        SELECT COALESCE(SUM(s.streams), 0) AS total_streams
        FROM songs s
        JOIN song_artists sa ON s.id = sa.song_id
        WHERE sa.artist_id = $1
          AND ${notDeletedCondition("song", "s")}
      `;

      const res = await query(sql, [artistId]);
      return parseInt(res[0]?.total_streams ?? "0", 10);
    } catch (error) {
      console.error("Error fetching total streams for artist:", error);
      throw error;
    }
  }

  static async getMonthlyListeners(artistId: UUID): Promise<number> {
    try {
      const artistDeleted = await isDeleted(artistId, "artist");
      if (artistDeleted) {
        throw new Error("Artist is deleted.");
      }

      const sql = `
        SELECT ald.listeners_28d AS monthly_listeners
        FROM artist_listeners_28d_daily ald
        JOIN artists ar ON ar.id = ald.artist_id
        WHERE ald.artist_id = $1
          AND ${notDeletedCondition("artist", "ar")}
        ORDER BY ald.day DESC
        LIMIT 1
      `;

      const res = await query(sql, [artistId]);
      return parseInt(res[0]?.monthly_listeners ?? "0", 10);
    } catch (error) {
      console.error("Error fetching monthly listeners for artist:", error);
      throw error;
    }
  }

  static async pinAlbumToArtistPage(artistId: UUID, albumId: UUID) {
    try {
      const artistDeleted = await isDeleted(artistId, "artist");
      if (artistDeleted) {
        throw new Error("Artist is deleted.");
      }

      const albumDeleted = await isDeleted(albumId, "album");
      if (albumDeleted) {
        throw new Error("Album is deleted.");
      }

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
      const artistDeleted = await isDeleted(artistId, "artist");
      if (artistDeleted) {
        throw new Error("Artist is deleted.");
      }

      const albumDeleted = await isDeleted(albumId, "album");
      if (albumDeleted) {
        throw new Error("Album is deleted.");
      }

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

  static async checkArtistHasArtistPlaylists(artistId: UUID): Promise<boolean> {
    try {
      const res = await query(
        `SELECT EXISTS (
          SELECT 1 FROM artist_playlists ap
          WHERE ap.artist_id = $1 AND NOT EXISTS (
            SELECT 1 FROM deleted_playlists dp 
            WHERE dp.playlist_id = ap.playlist_id
          )
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
          WHERE artist_id = $1 AND NOT EXISTS (
            SELECT 1 FROM deleted_songs ds 
            WHERE ds.song_id = song_artists.song_id
          )
        ) AS has_songs`,
        [artistId]
      );

      return result[0]?.has_songs ?? false;
    } catch (error) {
      console.error("Error checking if artist has songs:", error);
      throw error;
    }
  }
}
