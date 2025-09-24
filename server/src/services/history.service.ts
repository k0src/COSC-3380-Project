import type { User, UUID } from "@types";
import { SongRepository as Song } from "@repositories";
import { AlbumRepository as Album } from "@repositories";
import { PlaylistRepository as Playlist } from "@repositories";
import { ArtistRepository as Artist } from "@repositories";
import { query } from "../config/database.js";

export default class HistoryService {
  /**
   * Gets the song history for a user.
   * @param userId - The ID of the user.
   * @returns An array of songs and the time they were played.
   * @throws Error if the operation fails
   */
  static async getSongHistory(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Array<{ song: Song; played_at: string }>> {
    try {
      let baseQuery = `
        SELECT s.*, sh.played_at FROM songs s
        JOIN song_history sh ON s.id = sh.song_id
        WHERE sh.user_id = $1
        ORDER BY sh.played_at DESC`;

      const params: any[] = [userId];

      if (options?.limit) {
        baseQuery += ` LIMIT $${params.length + 1}`;
        params.push(options.limit);

        if (options?.offset) {
          baseQuery += ` OFFSET $${params.length + 1}`;
          params.push(options.offset);
        }
      }

      const res = await query(baseQuery, params);

      if (!res || res.length === 0) {
        return [];
      }

      const history: Array<{ song: Song; played_at: string }> = res.map(
        (row) => {
          const { played_at, ...songData } = row;
          return { song: songData as Song, played_at };
        }
      );

      return history;
    } catch (error) {
      console.error("Error getting song history:", error);
      throw error;
    }
  }

  /**
   * Gets the album history for a user.
   * @param userId - The ID of the user.
   * @returns An array of albums and the time they were played.
   * @throws Error if the operation fails
   */
  static async getAlbumHistory(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Array<{ album: Album; played_at: string }>> {
    try {
      let baseQuery = `
        SELECT a.*, ah.played_at FROM albums a
        JOIN album_history ah ON a.id = ah.album_id
        WHERE ah.user_id = $1
        ORDER BY ah.played_at DESC`;

      const params: any[] = [userId];

      if (options?.limit) {
        baseQuery += ` LIMIT $${params.length + 1}`;
        params.push(options.limit);

        if (options?.offset) {
          baseQuery += ` OFFSET $${params.length + 1}`;
          params.push(options.offset);
        }
      }

      const res = await query(baseQuery, params);

      if (!res || res.length === 0) {
        return [];
      }

      const history: Array<{ album: Album; played_at: string }> = res.map(
        (row) => {
          const { played_at, ...albumData } = row;
          return { album: albumData as Album, played_at };
        }
      );

      return history;
    } catch (error) {
      console.error("Error getting album history:", error);
      throw error;
    }
  }

  /**
   * Gets the playlist history for a user.
   * @param userId - The ID of the user.
   * @returns An array of playlists and the time they were played.
   * @throws Error if the operation fails
   */
  static async getPlaylistHistory(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Array<{ playlist: Playlist; played_at: string }>> {
    try {
      let baseQuery = `
        SELECT p.*, ph.played_at FROM playlists p
        JOIN playlist_history ph ON p.id = ph.playlist_id
        WHERE ph.user_id = $1
        ORDER BY ph.played_at DESC`;

      const params: any[] = [userId];

      if (options?.limit) {
        baseQuery += ` LIMIT $${params.length + 1}`;
        params.push(options.limit);

        if (options?.offset) {
          baseQuery += ` OFFSET $${params.length + 1}`;
          params.push(options.offset);
        }
      }

      const res = await query(baseQuery, params);

      if (!res || res.length === 0) {
        return [];
      }

      const history: Array<{ playlist: Playlist; played_at: string }> = res.map(
        (row) => {
          const { played_at, ...playlistData } = row;
          return { playlist: playlistData as Playlist, played_at };
        }
      );

      return history;
    } catch (error) {
      console.error("Error getting playlist history:", error);
      throw error;
    }
  }

  /**
   * Gets the artist history for a user.
   * @param userId - The ID of the user.
   * @returns An array of artists and the time they were played.
   * @throws Error if the operation fails
   */
  static async getArtistHistory(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Array<{ artist: Artist; played_at: string }>> {
    try {
      let baseQuery = `
        SELECT a.*, ah.played_at FROM artists a
        JOIN artist_history ah ON a.id = ah.artist_id
        WHERE ah.user_id = $1
        ORDER BY ah.played_at DESC`;

      const params: any[] = [userId];

      if (options?.limit) {
        baseQuery += ` LIMIT $${params.length + 1}`;
        params.push(options.limit);

        if (options?.offset) {
          baseQuery += ` OFFSET $${params.length + 1}`;
          params.push(options.offset);
        }
      }

      const res = await query(baseQuery, params);

      if (!res || res.length === 0) {
        return [];
      }

      const history: Array<{ artist: Artist; played_at: string }> = res.map(
        (row) => {
          const { played_at, ...artistData } = row;
          return { artist: artistData as Artist, played_at };
        }
      );

      return history;
    } catch (error) {
      console.error("Error getting artist history:", error);
      throw error;
    }
  }
}
