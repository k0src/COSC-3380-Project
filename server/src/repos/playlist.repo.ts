import { Playlist, UUID } from "@types";
import { SongRepository as Song } from "@repositories";
import { query, withTransaction } from "../config/database";
import { getBlobUrl } from "config/blobStorage";

export default class PlaylistRepository {
  /* ----------------------------- HELPER METHODS ----------------------------- */

  /**
   * Fetches the songs on the playlist and attaches them to the playlist object.
   * @param playlist - The playlist object.
   * @throws Will throw an error if the database query fails.
   */
  private static async getSongs(playlist: Playlist) {
    const songIds = await query(
      `SELECT s.id, ps.added_at FROM songs s
      JOIN playlist_songs ps ON s.id = ps.song_id
      WHERE ps.playlist_id = $1`,
      [playlist.id]
    );

    if (songIds && songIds.length > 0) {
      for (const { id, added_at } of songIds) {
        const song = await Song.getOne(id, {
          includeAlbum: true,
          includeArtists: true,
        });
        if (song) {
          if (!playlist.songs) {
            playlist.songs = [];
          }
          playlist.songs.push({ song, added_at });
        }
      }
    }
  }

  /**
   * Fetches the user who made the playlist and attaches it to the playlist object.
   * @param playlist - The playlist object.
   * @throws Will throw an error if the database query fails.
   */
  private static async getUser(playlist: Playlist) {
    const user = await query(
      `SELECT u.* FROM users u
      JOIN playlists p ON u.id = p.created_by
      WHERE p.id = $1`,
      [playlist.id]
    );

    if (user && user.length > 0) {
      playlist.user = user[0];
      if (playlist.user && playlist.user.profile_picture_url) {
        playlist.user.profile_picture_url = getBlobUrl(
          playlist.user.profile_picture_url
        );
      }
    }
  }

  /**
   * Fetches the like count for a playlist and attaches it to the playlist object.
   * @param playlist - The playlist object.
   * @throws Will throw an error if the database query fails.
   */
  private static async getLikes(playlist: Playlist) {
    const likes = await query(
      `SELECT COUNT(*) AS likes FROM playlist_likes WHERE playlist_id = $1`,
      [playlist.id]
    );
    if (likes && likes.length > 0) {
      playlist.likes = parseInt(likes[0].likes, 10) || 0;
    }
  }

  /* ------------------------------ MAIN METHODS ------------------------------ */

  /**
   * Creates a new playlist.
   * @param playlistData - The data for the new playlist.
   * @param playlist.title - The title of the playlist.
   * @param playlist.description - The description of the playlist.
   * @param playlist.created_by - The ID of the user who created the playlist.
   * @returns The created playlist, or null if creation fails.
   * @throws Will throw an error if the database query fails.
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
   * @param id - The ID of the playlist to update.
   * @param playlistData - The new data for the playlist.
   * @param playlist.title - The new title of the playlist (optional).
   * @param playlist.description - The new description of the playlist (optional).
   * @param playlist.created_by - The new ID of the user who created the playlist (optional).
   * @returns The updated playlist, or null if the update fails.
   * @throws Error if no fields are provided to update or if the database query fails.
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
   * @param id - The ID of the playlist to delete.
   * @returns The deleted playlist, or null if the deletion fails.
   * @throws Will throw an error if the database query fails.
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

  /**
   * Gets a single playlist by ID.
   * @param id - The ID of the playlist to get.
   * @param options - Options for including related data.
   * @param options.includeSongs - Option to include the songs in the playlist.
   * @param options.includeUser - Option to include the user who created the playlist.
   * @param options.includeLikes - Option to include the like count.
   * @returns The playlist, or null if not found.
   * @throws Will throw an error if the database query fails.
   */
  static async getOne(
    id: UUID,
    options?: {
      includeSongs?: boolean;
      includeUser?: boolean;
      includeLikes?: boolean;
    }
  ): Promise<Playlist | null> {
    try {
      const res = await query("SELECT * FROM playlists WHERE id = $1", [id]);

      if (!res || res.length === 0) {
        return null;
      }

      let playlist: Playlist = res[0];

      if (options?.includeSongs) {
        await this.getSongs(playlist);
      }
      if (options?.includeUser) {
        await this.getUser(playlist);
      }
      if (options?.includeLikes) {
        await this.getLikes(playlist);
      }

      return playlist;
    } catch (error) {
      console.error("Error fetching playlist:", error);
      throw error;
    }
  }

  /**
   * Gets multiple playlists.
   * @param options - Options for pagination and including related data.
   * @param options.includeSongs - Option to include the songs in each playlist.
   * @param options.includeUser - Option to include the user who created each playlist.
   * @param options.includeLikes - Option to include the like count for each playlist.
   * @param options.limit - Maximum number of playlists to return.
   * @param options.offset - Number of playlists to skip.
   * @returns A list of playlists.
   * @throws Will throw an error if the database query fails.
   */
  static async getMany(options?: {
    includeSongs?: boolean;
    includeUser?: boolean;
    includeLikes?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Playlist[]> {
    try {
      let baseQuery = "SELECT * FROM playlists ORDER BY created_at DESC";
      const params: any[] = [];

      if (options?.limit) {
        baseQuery += ` LIMIT $${params.length + 1}`;
        params.push(options.limit);

        if (options?.offset) {
          baseQuery += ` OFFSET $${params.length + 1}`;
          params.push(options.offset);
        }
      }

      const playlists = await query(baseQuery, params);

      if (!playlists || playlists.length === 0) {
        return [];
      }

      const processedPlaylists = await Promise.all(
        playlists.map(async (playlist: Playlist) => {
          if (options?.includeSongs) {
            await this.getSongs(playlist);
          }
          if (options?.includeUser) {
            await this.getUser(playlist);
          }
          if (options?.includeLikes) {
            await this.getLikes(playlist);
          }

          return playlist;
        })
      );

      return processedPlaylists;
    } catch (error) {
      console.error("Error fetching playlists:", error);
      throw error;
    }
  }
}
