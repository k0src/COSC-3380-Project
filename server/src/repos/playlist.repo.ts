import {
  AccessContext,
  Playlist,
  PlaylistOptions,
  PlaylistSong,
  SongOptions,
  UUID,
  VisibilityStatus,
} from "@types";
import { query, withTransaction } from "@config/database";
import { getBlobUrl } from "@config/blobStorage";
import { getAccessPredicate } from "@util";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export default class PlaylistRepository {
  static async create({
    title,
    description,
    created_by,
    visibility_status = "PUBLIC",
    image_url,
    image_url_blurhash,
  }: {
    title: string;
    description: string;
    created_by: UUID;
    visibility_status?: VisibilityStatus;
    image_url?: string;
    image_url_blurhash?: string;
  }): Promise<Playlist | null> {
    try {
      if (!title || typeof title !== "string" || title.trim() === "") {
        throw new Error("Playlist title cannot be empty");
      }

      const res = await withTransaction(async (client) => {
        const insert = await client.query(
          `INSERT INTO playlists (title, description, created_by, visibility_status, image_url, image_url_blurhash)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [
            title,
            description,
            created_by,
            visibility_status,
            image_url,
            image_url_blurhash,
          ]
        );
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
      created_by,
      visibility_status,
      image_url,
      image_url_blurhash,
    }: {
      title?: string;
      description?: string;
      created_by?: UUID;
      visibility_status?: VisibilityStatus;
      image_url?: string;
      image_url_blurhash?: string;
    }
  ): Promise<Playlist | null> {
    try {
      if (
        title !== undefined &&
        (typeof title !== "string" || title.trim() === "")
      ) {
        throw new Error("Playlist title cannot be empty");
      }

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
      if (created_by !== undefined) {
        fields.push(`created_by = $${values.length + 1}`);
        values.push(created_by);
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

      const res = await withTransaction(async (client) => {
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

  /**
   * Deletes a playlist.
   * @param id The ID of the playlist to delete.
   * @returns The deleted playlist, or null if the deletion fails.
   * @throws Error if the operation fails.
   */
  static async delete(id: UUID): Promise<Playlist | null> {
    try {
      const res = await withTransaction(async (client) => {
        const del = await client.query(
          `DELETE FROM playlists WHERE id = $1 RETURNING *`,
          [id]
        );
        return del.rows[0] ?? null;
      });

      return res;
    } catch (error) {
      console.error("Error deleting playlist:", error);
      throw error;
    }
  }
  static async getOne(
    id: UUID,
    accessContext: AccessContext,
    options?: PlaylistOptions
  ): Promise<Playlist | null> {
    try {
      const selectFields: string[] = ["p.*"];

      if (options?.includeUser) {
        selectFields.push(`
        row_to_json(u.*) AS user
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
        (SELECT COALESCE(SUM(s.duration), 0) FROM songs s
          JOIN playlist_songs ps ON ps.song_id = s.id
          WHERE ps.playlist_id = p.id) AS runtime
      `);
      }

      selectFields.push(`
      EXISTS (SELECT 1 FROM playlist_songs ps WHERE ps.playlist_id = p.id) AS has_song
    `);

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM playlists p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = $1
        LIMIT 1
      `;

      const params = [id];
      const res = await query(sql, params);
      if (!res || res.length === 0) return null;

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
      console.error("Error fetching playlist:", error);
      throw error;
    }
  }

  static async getMany(
    accessContext: AccessContext,
    options?: PlaylistOptions
  ): Promise<Playlist[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const selectFields: string[] = ["p.*"];

      if (options?.includeUser) {
        selectFields.push(`
        row_to_json(u.*) AS user
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
        (SELECT COALESCE(SUM(s.duration), 0) FROM songs s
          JOIN playlist_songs ps ON ps.song_id = s.id
          WHERE ps.playlist_id = p.id) AS runtime
      `);
      }

      selectFields.push(`
      EXISTS (SELECT 1 FROM playlist_songs ps WHERE ps.playlist_id = p.id) AS has_song
    `);

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM playlists p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const params = [limit, offset];
      const playlists = await query(sql, params);
      if (!playlists || playlists.length === 0) return [];

      return playlists.map((playlist: Playlist) => {
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

  static async getSongs(
    playlistId: UUID,
    accessContext: AccessContext,
    options?: SongOptions
  ): Promise<PlaylistSong[]> {
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

      const playlistIdIndex = predicateParams.length + 1;
      const limitIndex = predicateParams.length + 2;
      const offsetIndex = predicateParams.length + 3;

      const sql = `
        SELECT ${selectFields.join(",\n")}, ps.added_at
        FROM songs s
        JOIN playlist_songs ps ON s.id = ps.song_id
        WHERE (${predicateSql}) AND ps.playlist_id = $${playlistIdIndex}
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const params = [...predicateParams, playlistId, limit, offset];
      const songs = await query(sql, params);
      if (!songs || songs.length === 0) return [];

      return songs.map((song: PlaylistSong) => {
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
      console.error("Error fetching playlist songs:", error);
      throw error;
    }
  }

  static async addSongs(playlistId: UUID, songIds: UUID[]) {
    try {
      await withTransaction(async (client) => {
        for (const songId of songIds) {
          await client.query(
            `INSERT INTO playlist_songs (playlist_id, song_id)
            VALUES ($1, $2)
            ON CONFLICT (playlist_id, song_id) DO NOTHING`,
            [playlistId, songId]
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

  static async count(): Promise<number> {
    try {
      const res = await query("SELECT COUNT(*) FROM playlists");
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting playlists:", error);
      throw error;
    }
  }

  static async getCoverImageUrls(
    playlistId: UUID,
    limit: number = 4
  ): Promise<string[]> {
    try {
      const songs = await query(
        `SELECT s.image_url
         FROM playlist_songs ps
         JOIN songs s ON ps.song_id = s.id
         WHERE ps.playlist_id = $1
         AND s.image_url IS NOT NULL
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
    options?: PlaylistOptions
  ): Promise<Playlist[]> {
    try {
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;

      const playlists = await query(
        "SELECT * FROM get_related_playlists($1, $2, $3, $4, $5, $6, $7)",
        [
          playlistId,
          options?.includeUser ?? false,
          options?.includeLikes ?? false,
          options?.includeSongCount ?? false,
          options?.includeRuntime ?? false,
          limit,
          offset,
        ]
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
