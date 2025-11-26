import {
  AccessContext,
  Playlist,
  PlaylistSong,
  UUID,
  VisibilityStatus,
  PlaylistOrderByColumn,
  OrderByDirection,
} from "@types";
import { query, withTransaction } from "@config/database";
import { getBlobUrl } from "@config/blobStorage";
import {
  getUserVisibilityCondition,
  getVisibilityCondition,
  notDeletedCondition,
  isDeleted,
} from "@util";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export default class PlaylistRepository {
  static async create({
    title,
    description,
    owner_id,
    artist_id,
    visibility_status = "PUBLIC",
    image_url,
    image_url_blurhash,
  }: {
    title: string;
    description: string;
    owner_id: UUID;
    artist_id?: UUID;
    visibility_status?: VisibilityStatus;
    image_url?: string;
    image_url_blurhash?: string;
  }): Promise<Playlist | null> {
    try {
      if (!owner_id) {
        throw new Error("Owner ID is required");
      }
      const ownerDeleted = await isDeleted(owner_id, "user");
      if (ownerDeleted) {
        throw new Error("Cannot create playlist for a deleted user.");
      }

      if (artist_id) {
        const artistDeleted = await isDeleted(artist_id, "artist");
        if (artistDeleted) {
          throw new Error(
            "Cannot create an artist playlist for a deleted artist."
          );
        }
      }

      if (!title || typeof title !== "string" || title.trim() === "") {
        throw new Error("Playlist title cannot be empty");
      }

      const res = await withTransaction(async (client) => {
        const insert = await client.query(
          `INSERT INTO playlists (title, description, owner_id, visibility_status, image_url, image_url_blurhash)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [
            title,
            description,
            owner_id,
            visibility_status,
            image_url,
            image_url_blurhash,
          ]
        );

        if (artist_id) {
          await client.query(
            `INSERT INTO artist_playlists (artist_id, playlist_id)
            VALUES ($1, $2)`,
            [artist_id, insert.rows[0].id]
          );
        }

        return insert.rows[0] ?? null;
      });

      if (res) {
        if (res.image_url) {
          res.image_url = getBlobUrl(res.image_url);
        }
        res.type = "playlist";
      }

      return res;
    } catch (error) {
      console.error("Error creating playlist:", error);
      throw error;
    }
  }

  static async update(
    id: UUID,
    {
      title,
      description,
      owner_id,
      visibility_status,
      image_url,
      image_url_blurhash,
    }: {
      title?: string;
      description?: string;
      owner_id?: UUID;
      visibility_status?: VisibilityStatus;
      image_url?: string;
      image_url_blurhash?: string;
    }
  ): Promise<Playlist | null> {
    try {
      if (!owner_id) {
        throw new Error("Owner ID is required");
      }
      const ownerDeleted = await isDeleted(owner_id, "user");
      if (ownerDeleted) {
        throw new Error("Cannot update playlist for a deleted user.");
      }

      const playlistDeleted = await isDeleted(id, "playlist");
      if (playlistDeleted) {
        throw new Error("Cannot update a deleted playlist.");
      }

      if (
        title !== undefined &&
        (typeof title !== "string" || title.trim() === "")
      ) {
        throw new Error("Playlist title cannot be empty");
      }
      const res = await withTransaction(async (client) => {
        const fields: string[] = [];
        const values: any[] = [];

        if (title !== undefined) {
          fields.push(`title = $${values.length + 1}`);
          values.push(title);
        }
        if (description !== undefined) {
          fields.push(`description = $${values.length + 1}`);
          values.push(description);
        }
        if (visibility_status !== undefined) {
          fields.push(`visibility_status = $${values.length + 1}`);
          values.push(visibility_status);
        }
        if (image_url !== undefined) {
          fields.push(`image_url = $${values.length + 1}`);
          values.push(image_url);
        }
        if (image_url_blurhash !== undefined) {
          fields.push(`image_url_blurhash = $${values.length + 1}`);
          values.push(image_url_blurhash);
        }
        if (fields.length === 0) {
          throw new Error("No fields to update");
        }

        values.push(id);

        const sql = `UPDATE playlists SET ${fields.join(", ")} WHERE id = $${
          values.length
        } RETURNING *`;
        const res = await client.query(sql, values);
        return res.rows[0] ?? null;
      });

      if (res) {
        if (res.image_url) {
          res.image_url = getBlobUrl(res.image_url);
        }
        res.type = "playlist";
      }

      return res;
    } catch (error) {
      console.error("Error updating playlist:", error);
      throw error;
    }
  }

  static async delete(id: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO deleted_playlists
          (playlist_id, deleted_at)
          VALUES ($1, NOW())`,
          [id]
        );
      });
    } catch (error) {
      console.error("Error deleting playlist:", error);
      throw error;
    }
  }

  static async bulkDelete(playlistIds: UUID[]) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO deleted_playlists
          (playlist_id, deleted_at)
          SELECT id, NOW() FROM playlists WHERE id = ANY($1)`,
          [playlistIds]
        );
      });
    } catch (error) {
      console.error("Error bulk deleting playlists:", error);
      throw error;
    }
  }

  static async getPlaylistDetails(
    id: UUID,
    accessContext: AccessContext
  ): Promise<Playlist | null> {
    try {
      const playlistVisibility = getVisibilityCondition(
        "p",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

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
        WHERE p.id = $1
          AND ${notDeletedCondition("playlist", "p")}
          AND ${playlistVisibility}
        LIMIT 1
      `;

      const res = await query(sql, [id]);

      if (!res || res.length === 0) {
        return null;
      }

      const playlist: Playlist = res[0];

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
    } catch (error) {
      console.error("Error fetching playlist details:", error);
      throw error;
    }
  }

  static async getManyPlaylists(
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
        WHERE ${notDeletedCondition("playlist", "p")}
          AND ${playlistVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $1 OFFSET $2
      `;

      const res = await query(sql, [limit, offset]);
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
      console.error("Error fetching playlists:", error);
      throw error;
    }
  }

  static async getSongs(
    playlistId: UUID,
    accessContext: AccessContext,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<PlaylistSong[]> {
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
          ps.position,
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
        JOIN playlist_songs ps ON s.id = ps.song_id
        WHERE ps.playlist_id = $1
          AND ${notDeletedCondition("song", "s")}
          AND ${songVisibility}
        ORDER BY ps.position ASC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [playlistId, limit, offset]);

      if (!res || res.length === 0) {
        return [];
      }

      const songs: PlaylistSong[] = res.map((song: PlaylistSong) => {
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
      console.error("Error fetching playlist songs:", error);
      throw error;
    }
  }

  static async addSongs(playlistId: UUID, songIds: UUID[]) {
    try {
      const playlistDeleted = await isDeleted(playlistId, "playlist");
      if (playlistDeleted) {
        throw new Error("Cannot add songs to a deleted playlist.");
      }

      for (const songId of songIds) {
        const songDeleted = await isDeleted(songId, "song");
        if (songDeleted) {
          throw new Error(
            `Cannot add deleted song (ID: ${songId}) to playlist.`
          );
        }
      }

      await withTransaction(async (client) => {
        for (const songId of songIds) {
          const maxPositionRes = await client.query(
            `SELECT COALESCE(MAX(position), 0) AS max_position
            FROM playlist_songs
            WHERE playlist_id = $1`,
            [playlistId]
          );

          const nextPosition =
            maxPositionRes?.rows[0]?.max_position !== undefined
              ? maxPositionRes.rows[0].max_position + 1
              : 1;

          await client.query(
            `INSERT INTO playlist_songs (playlist_id, song_id, position)
            VALUES ($1, $2, $3)
            ON CONFLICT (playlist_id, song_id) DO NOTHING`,
            [playlistId, songId, nextPosition]
          );
        }
      });
    } catch (error) {
      console.error("Error adding songs to playlist:", error);
      throw error;
    }
  }

  static async removeSongs(playlistId: UUID, songIds: UUID[]) {
    try {
      const playlistDeleted = await isDeleted(playlistId, "playlist");
      if (playlistDeleted) {
        throw new Error("Cannot remove songs from a deleted playlist.");
      }

      for (const songId of songIds) {
        const songDeleted = await isDeleted(songId, "song");
        if (songDeleted) {
          throw new Error(
            `Cannot remove deleted song (ID: ${songId}) from playlist.`
          );
        }
      }

      await withTransaction(async (client) => {
        for (const songId of songIds) {
          await client.query(
            `DELETE FROM playlist_songs
            WHERE playlist_id = $1 AND song_id = $2`,
            [playlistId, songId]
          );
        }
      });
    } catch (error) {
      console.error("Error removing songs from playlist:", error);
      throw error;
    }
  }

  static async getCoverImageUrls(
    playlistId: UUID,
    limit: number = 4
  ): Promise<string[]> {
    try {
      const playlistDeleted = await isDeleted(playlistId, "playlist");
      if (playlistDeleted) {
        throw new Error("Cannot fetch cover images for a deleted playlist.");
      }

      const songs = await query(
        `SELECT s.image_url
         FROM playlist_songs ps
         JOIN songs s ON ps.song_id = s.id
         WHERE ps.playlist_id = $1
         AND s.image_url IS NOT NULL
         AND NOT EXISTS (
            SELECT 1 FROM deleted_songs ds
            WHERE ds.song_id = s.id
         )
         GROUP BY s.image_url, ps.added_at
         ORDER BY ps.added_at
         LIMIT $2`,
        [playlistId, limit]
      );

      if (!songs || songs.length === 0) {
        return [];
      }

      return songs.map((song: any) => getBlobUrl(song.image_url));
    } catch (error) {
      console.error("Error fetching playlist cover image URLs:", error);
      throw error;
    }
  }

  static async getRelatedPlaylists(
    playlistId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Playlist[]> {
    try {
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;

      const playlists = await query(
        "SELECT * FROM get_related_playlists($1, $2, $3, $4, $5, $6, $7)",
        [playlistId, true, true, true, true, limit, offset]
      );

      if (!playlists || playlists.length === 0) {
        return [];
      }

      const processedPlaylists = await Promise.all(
        playlists.map(async (playlist: Playlist) => {
          if (playlist.user && playlist.user.profile_picture_url) {
            playlist.user.profile_picture_url = getBlobUrl(
              playlist.user.profile_picture_url
            );
          }

          if (playlist.image_url) {
            playlist.image_url = getBlobUrl(playlist.image_url);
          } else {
            playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
          }

          playlist.type = "playlist";
          return playlist;
        })
      );

      return processedPlaylists;
    } catch (error) {
      console.error("Error fetching related playlists:", error);
      throw error;
    }
  }

  static async createRemixPlaylist(
    userId: UUID,
    playlistId: UUID,
    numberOfSongs: number = 30
  ): Promise<UUID> {
    try {
      const remixPlaylistId = await query(
        "SELECT create_remix_playlist($1, $2, $3)",
        [userId, playlistId, numberOfSongs]
      );

      return remixPlaylistId[0].create_remix_playlist;
    } catch (error) {
      console.error("Error creating remix playlist:", error);
      throw error;
    }
  }
}
