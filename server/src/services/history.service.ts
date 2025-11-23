import type { UUID, Song, Album, Playlist, Artist } from "@types";
import { query } from "@config/database.js";

type HistoryEntity = "song" | "album" | "playlist" | "artist";

type HistoryEntityMap = {
  song: Song;
  album: Album;
  playlist: Playlist;
  artist: Artist;
};

const HISTORY_TABLES: Record<HistoryEntity, string> = {
  song: "song_history",
  album: "album_history",
  playlist: "playlist_history",
  artist: "artist_history",
};

export default class HistoryService {
  static async clearHistory(userId: UUID): Promise<void> {
    try {
      await query("DELETE FROM song_history WHERE user_id = $1", [userId]);
      await query("DELETE FROM album_history WHERE user_id = $1", [userId]);
      await query("DELETE FROM playlist_history WHERE user_id = $1", [userId]);
      await query("DELETE FROM artist_history WHERE user_id = $1", [userId]);
    } catch (error) {
      console.error("Error clearing history:", error);
      throw error;
    }
  }

  static async addToHistory<K extends keyof HistoryEntityMap>(
    userId: UUID,
    entityId: UUID,
    entity: K
  ) {
    try {
      const table = HISTORY_TABLES[entity];
      if (!table) {
        throw new Error("Invalid entity type");
      }

      await query(
        `INSERT INTO ${table} (user_id, ${entity}_id) VALUES ($1, $2)`,
        [userId, entityId]
      );

      if (entity === "song") {
        await this.addRelatedEntitiesForSong(userId, entityId);
      }
    } catch (error) {
      console.error("Error adding to history:", error);
      throw error;
    }
  }

  private static async addRelatedEntitiesForSong(
    userId: UUID,
    songId: UUID
  ): Promise<void> {
    try {
      const albumResult = await query(
        `SELECT album_id FROM album_songs WHERE song_id = $1 LIMIT 1`,
        [songId]
      );

      if (albumResult.length > 0) {
        const albumId = albumResult[0].album_id;
        await query(
          `INSERT INTO album_history (user_id, album_id) VALUES ($1, $2)`,
          [userId, albumId]
        );
      }

      const artistsResult = await query(
        `SELECT artist_id FROM song_artists WHERE song_id = $1`,
        [songId]
      );

      for (const artist of artistsResult) {
        await query(
          `INSERT INTO artist_history (user_id, artist_id) VALUES ($1, $2)`,
          [userId, artist.artist_id]
        );
      }
    } catch (error) {
      console.error("Error adding related entities to history:", error);
    }
  }

  static async checkUserHasHistory(userId: UUID): Promise<boolean> {
    try {
      const result = await query(
        `SELECT EXISTS (
          SELECT 1 FROM song_history
          WHERE user_id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_songs 
              WHERE deleted_songs.song_id = song_history.song_id
            )
          UNION
          SELECT 1 FROM album_history
          WHERE user_id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_albums 
              WHERE deleted_albums.album_id = album_history.album_id
            )
          UNION
          SELECT 1 FROM playlist_history
          WHERE user_id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_playlists 
              WHERE deleted_playlists.playlist_id = playlist_history.playlist_id
            )
          UNION
          SELECT 1 FROM artist_history
          WHERE user_id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_artists 
              WHERE deleted_artists.artist_id = artist_history.artist_id
            )
        ) AS has_history`,
        [userId]
      );
      return result[0]?.has_history || false;
    } catch (error) {
      console.error("Error checking user history:", error);
      throw error;
    }
  }

  static async checkUserHasSongHistory(userId: UUID): Promise<boolean> {
    try {
      const result = await query(
        `SELECT EXISTS (
          SELECT 1 FROM song_history
          WHERE user_id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_songs
              WHERE deleted_songs.song_id = song_history.song_id
            )
        ) AS has_song_history`,
        [userId]
      );
      return result[0]?.has_song_history || false;
    } catch (error) {
      console.error("Error checking user song history:", error);
      throw error;
    }
  }
}
