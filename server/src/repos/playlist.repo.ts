import { Playlist, PlaylistSong, UUID } from "@types";
import { query, withTransaction } from "@config/database";
import { getBlobUrl } from "@config/blobStorage";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export default class PlaylistRepository {
  /**
   * Creates a new playlist.
   * @param playlistData The data for the new playlist.
   * @param playlist.title The title of the playlist.
   * @param playlist.description The description of the playlist.
   * @param playlist.created_by The ID of the user who created the playlist.
   * @returns The created playlist, or null if creation fails.
   * @throws Error if the operation fails.
   */
  static async create({
    title,
    description,
    created_by,
  }: {
    title: string;
    description: string;
    created_by: UUID;
  }): Promise<Playlist | null> {
    try {
      const res = await query(
        `INSERT INTO playlists (title, description, created_by)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [title, description, created_by]
      );

      return res[0] ?? null;
    } catch (error) {
      console.error("Error creating playlist:", error);
      throw error;
    }
  }

  /**
   * Updates a playlist.
   * @param id The ID of the playlist to update.
   * @param playlistData The new data for the playlist.
   * @param playlist.title The new title of the playlist (optional).
   * @param playlist.description The new description of the playlist (optional).
   * @param playlist.created_by The new ID of the user who created the playlist (optional).
   * @returns The updated playlist, or null if the update fails.
   * @throws Error if the operation fails.
   */
  static async update(
    id: UUID,
    {
      title,
      description,
      created_by,
    }: { title?: string; description?: string; created_by?: UUID }
  ): Promise<Playlist | null> {
    try {
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

  //! get playlist cover image here
  //! make cover image optional
  /**
   * Gets a single playlist by ID.
   * @param id The ID of the playlist to get.
   * @param options Options for including related data.
   * @param options.includeUser Option to include the user who created the playlist.
   * @param options.includeLikes Option to include the like count.
   * @param options.includeSongCount Option to include the total number of songs on the playlist.
   * @param options.includeRuntime Option to include the total runtime of the playlist.
   * @returns The playlist, or null if not found.
   * @throws Error if the operation fails.
   */
  static async getOne(
    id: UUID,
    options?: {
      includeUser?: boolean;
      includeLikes?: boolean;
      includeSongCount?: boolean;
      includeRuntime?: boolean;
    }
  ): Promise<Playlist | null> {
    try {
      const sql = `
        SELECT p.*,
        CASE WHEN $1 THEN row_to_json(u.*)
        ELSE NULL END as user,
        CASE WHEN $2 THEN (SELECT COUNT(*) FROM playlist_likes pl
          WHERE pl.playlist_id = p.id)
        ELSE NULL END as likes,
        CASE WHEN $3 THEN (SELECT COUNT(*) FROM playlist_songs ps
          WHERE ps.playlist_id = p.id)
        ELSE NULL END as song_count,
        CASE WHEN $4 THEN (SELECT COALESCE(SUM(s.duration), 0) FROM songs s
          JOIN playlist_songs ps ON ps.song_id = s.id
          WHERE ps.playlist_id = p.id)
        ELSE NULL END as runtime
        FROM playlists p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = $5
        LIMIT 1
      `;

      const params = [
        options?.includeUser ?? false,
        options?.includeLikes ?? false,
        options?.includeSongCount ?? false,
        options?.includeRuntime ?? false,
        id,
      ];

      const res = await query(sql, params);
      if (!res || res.length === 0) {
        return null;
      }

      const playlist: Playlist = res[0];
      if (playlist.user && playlist.user.profile_picture_url) {
        playlist.user.profile_picture_url = getBlobUrl(
          playlist.user.profile_picture_url
        );
      }

      playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
      playlist.type = "playlist";
      return playlist;
    } catch (error) {
      console.error("Error fetching playlist:", error);
      throw error;
    }
  }

  /**
   * Gets multiple playlists.
   * @param options Options for pagination and including related data.
   * @param options.includeUser Option to include the user who created each playlist.
   * @param options.includeLikes Option to include the like count for each playlist.
   * @param options.includeSongCount Option to include the total number of songs on each playlist.
   * @param options.includeRuntime Option to include the total runtime of the playlist.
   * @param options.limit Maximum number of playlists to return.
   * @param options.offset Number of playlists to skip.
   * @returns A list of playlists.
   * @throws Error if the operation fails.
   */
  static async getMany(options?: {
    includeUser?: boolean;
    includeLikes?: boolean;
    includeSongCount?: boolean;
    includeRuntime?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Playlist[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const sql = `
        SELECT p.*,
        CASE WHEN $1 THEN row_to_json(u.*)
        ELSE NULL END as user,
        CASE WHEN $2 THEN (SELECT COUNT(*) FROM playlist_likes pl
          WHERE pl.playlist_id = p.id)
        ELSE NULL END as likes,
        CASE WHEN $3 THEN (SELECT COUNT(*) FROM playlist_songs ps
          WHERE ps.playlist_id = p.id)
        ELSE NULL END as song_count,
        CASE WHEN $4 THEN (SELECT COALESCE(SUM(s.duration), 0) FROM songs s
          JOIN playlist_songs ps ON ps.song_id = s.id
          WHERE ps.playlist_id = p.id)
        ELSE NULL END as runtime
        FROM playlists p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
        LIMIT $5 OFFSET $6
      `;

      const params = [
        options?.includeUser ?? false,
        options?.includeLikes ?? false,
        options?.includeSongCount ?? false,
        options?.includeRuntime ?? false,
        limit,
        offset,
      ];

      const playlists = await query(sql, params);
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
          playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
          playlist.type = "playlist";
          return playlist;
        })
      );

      return processedPlaylists;
    } catch (error) {
      console.error("Error fetching playlists:", error);
      throw error;
    }
  }

  /**
   * Fetches all songs in a specific playlist.
   * @param playlistId The ID of the playlist.
   * @param options Options for pagination and including related data.
   * @param options.includeAlbums Option to include the albums data.
   * @param options.includeArtists Option to include the artists data.
   * @param options.includeLikes Option to include the like count.
   * @param options.limit Maximum number of songs to return.
   * @param options.offset Number of songs to skip.
   * @returns An array of songs in the playlist, with added_at timestamp.
   * @throws Error if the operation fails
   */
  static async getSongs(
    playlistId: UUID,
    options?: {
      includeAlbums?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<PlaylistSong[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const sql = `
        SELECT s.*, ps.added_at,
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
          ELSE NULL END as likes
        FROM songs s
        JOIN playlist_songs ps ON s.id = ps.song_id
        WHERE ps.playlist_id = $4
        ORDER BY ps.added_at
        LIMIT $5 OFFSET $6
      `;

      const params = [
        options?.includeAlbums ?? false,
        options?.includeArtists ?? false,
        options?.includeLikes ?? false,
        playlistId,
        limit,
        offset,
      ];

      const songs = await query(sql, params);
      if (!songs || songs.length === 0) {
        return [];
      }

      const processedSongs = await Promise.all(
        songs.map(async (song: PlaylistSong) => {
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
      console.error("Error fetching playlist songs:", error);
      throw error;
    }
  }

  /**
   * Adds songs to a playlist.
   * @param playlistId The ID of the playlist.
   * @param songIds An array of song IDs to add to the playlist.
   * @throws Error if the operation fails.
   */
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

  /**
   * Removes songs from a playlist.
   * @param playlistId The ID of the playlist.
   * @param songIds An array of song IDs to remove from the playlist.
   * @throws Error if the operation fails.
   */
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

  /**
   * Counts the total number of playlists.
   * @return The total number of playlists.
   * @throws Error if the operation fails.
   */
  static async count(): Promise<number> {
    try {
      const res = await query("SELECT COUNT(*) FROM playlists");
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting playlists:", error);
      throw error;
    }
  }

  /**
   * Fetches song image URLs from a playlist for cover generation.
   * @param playlistId The ID of the playlist.
   * @param limit Maximum number of song images to fetch (default: 4).
   * @returns An array of song image URLs with SAS tokens.
   * @throws Error if the operation fails.
   */
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

  /**
   * Fetches related playlists for a given playlist.
   * @param playlistId The ID of the playlist.
   * @param options Options for pagination and including related data.
   * @param options.includeUser Option to include the user who created each playlist.
   * @param options.includeLikes Option to include the like count for each playlist.
   * @param options.includeSongCount Option to include the total number of songs on each playlist.
   * @param options.includeRuntime Option to include the total runtime of the playlist.
   * @param options.limit Maximum number of playlists to return.
   * @param options.offset Number of playlists to skip.
   * @returns A list of related playlists.
   * @throws Error if the operation fails.
   */
  static async getRelatedPlaylists(
    playlistId: UUID,
    options?: {
      includeUser?: boolean;
      includeLikes?: boolean;
      includeSongCount?: boolean;
      includeRuntime?: boolean;
      limit?: number;
      offset?: number;
    }
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
          playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
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

  /**
   * Creates a remix playlist based on an existing playlist.
   * @param userId The ID of the user creating the remix.
   * @param playlistId The ID of the original playlist to remix.
   * @param numberOfSongs The number of songs to include in the remix playlist (default: 30).
   * @returns The ID of the newly created remix playlist.
   * @throws Error if the operation fails.
   */
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
