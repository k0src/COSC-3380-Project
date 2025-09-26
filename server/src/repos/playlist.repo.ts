import { Playlist, PlaylistSong, UUID } from "@types";
import { SongRepository } from "@repositories";
import { LikeService } from "@services";
import { query, withTransaction } from "../config/database";
import { getBlobUrl } from "config/blobStorage";
import { validatePlaylistId, validateSongId } from "@validators";

export default class PlaylistRepository {
  /* ----------------------------- HELPER METHODS ----------------------------- */

  /**
   * Fetches the user who made the playlist and attaches it to the playlist object.
   * @param playlist - The playlist object.
   * @throws Error if the operation fails.
   */
  private static async getUser(playlist: Playlist) {
    try {
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
    } catch (error) {
      console.error("Error fetching playlist user:", error);
      throw error;
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
   * @param id - The ID of the playlist to update.
   * @param playlistData - The new data for the playlist.
   * @param playlist.title - The new title of the playlist (optional).
   * @param playlist.description - The new description of the playlist (optional).
   * @param playlist.created_by - The new ID of the user who created the playlist (optional).
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
      if (!(await validatePlaylistId(id))) {
        throw new Error("Invalid playlist ID");
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
   * @throws Error if the operation fails.
   */
  static async delete(id: UUID): Promise<Playlist | null> {
    try {
      if (!(await validatePlaylistId(id))) {
        throw new Error("Invalid playlist ID");
      }

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
   * @param options.includeUser - Option to include the user who created the playlist.
   * @param options.includeLikes - Option to include the like count.
   * @returns The playlist, or null if not found.
   * @throws Error if the operation fails.
   */
  static async getOne(
    id: UUID,
    options?: {
      includeUser?: boolean;
      includeLikes?: boolean;
    }
  ): Promise<Playlist | null> {
    try {
      if (!(await validatePlaylistId(id))) {
        throw new Error("Invalid playlist ID");
      }

      const res = await query("SELECT * FROM playlists WHERE id = $1", [id]);

      if (!res || res.length === 0) {
        return null;
      }

      let playlist: Playlist = res[0];

      if (options?.includeUser) {
        await this.getUser(playlist);
      }
      if (options?.includeLikes) {
        playlist.likes = await LikeService.getLikeCount(
          playlist.id,
          "playlist"
        );
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
   * @param options.includeUser - Option to include the user who created each playlist.
   * @param options.includeLikes - Option to include the like count for each playlist.
   * @param options.limit - Maximum number of playlists to return.
   * @param options.offset - Number of playlists to skip.
   * @returns A list of playlists.
   * @throws Error if the operation fails.
   */
  static async getMany(options?: {
    includeUser?: boolean;
    includeLikes?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Playlist[]> {
    try {
      const params = [options?.limit || 50, options?.offset || 0];
      const sql = `
        SELECT * FROM playlists
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const playlists = await query(sql, params);
      if (!playlists || playlists.length === 0) {
        return [];
      }

      const processedPlaylists = await Promise.all(
        playlists.map(async (playlist: Playlist) => {
          if (options?.includeUser) {
            await this.getUser(playlist);
          }
          if (options?.includeLikes) {
            playlist.likes = await LikeService.getLikeCount(
              playlist.id,
              "playlist"
            );
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

  /**
   * Fetches all songs in a specific playlist.
   * @param playlistId The ID of the playlist.
   * @returns An array of songs in the playlist, with added_at timestamp.
   * @throws Error if the operation fails
   */
  static async getSongs(playlistId: UUID): Promise<PlaylistSong[]> {
    try {
      if (!(await validatePlaylistId(playlistId))) {
        throw new Error("Invalid playlist ID");
      }

      const songIds = await query(
        `SELECT song_id, added_at FROM playlist_songs 
        WHERE playlist_id = $1 ORDER BY added_at`,
        [playlistId]
      );

      const playlistSongs: PlaylistSong[] = [];

      if (songIds && songIds.length > 0) {
        for (const { song_id, added_at } of songIds) {
          const song = await SongRepository.getOne(song_id, {
            includeAlbum: true,
            includeArtists: true,
          });
          if (song) {
            (song as PlaylistSong).added_at = added_at;
            playlistSongs.push(song as PlaylistSong);
          }
        }
      }

      return playlistSongs;
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
      if (!(await validatePlaylistId(playlistId))) {
        throw new Error("Invalid playlist ID");
      }
      for (const songId of songIds) {
        if (!(await validateSongId(songId))) {
          throw new Error(`Invalid song ID: ${songId}`);
        }
      }

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
      if (!(await validatePlaylistId(playlistId))) {
        throw new Error("Invalid playlist ID");
      }
      for (const songId of songIds) {
        if (!(await validateSongId(songId))) {
          throw new Error(`Invalid song ID: ${songId}`);
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

  /**
   * Counts the total number of playlists.
   * @param playlistId - The ID of the playlist.
   * @return The total number of playlists.
   * @throws Error if the operation fails.
   */
  static async count(playlistId: UUID): Promise<number> {
    try {
      if (!(await validatePlaylistId(playlistId))) {
        throw new Error("Invalid playlist ID");
      }

      const res = await query(`SELECT COUNT(*) FROM playlists WHERE id = $1`, [
        playlistId,
      ]);
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting playlists:", error);
      throw error;
    }
  }
}
