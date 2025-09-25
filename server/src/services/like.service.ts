import type { UUID } from "@types";
import { query } from "../config/database.js";
import { validateMany } from "../validators/id.validator.js";

// toggle like songs, playlists, albums, artists, comments
// get likes by user

type Entity = "song" | "album" | "playlist";

const LIKE_FUNCTIONS: Record<Entity, string> = {
  song: "toggle_song_like",
  album: "toggle_album_like",
  playlist: "toggle_playlist_like",
};

/**
 * Service for managing likes on songs, albums, and playlists.
 */
export default class LikeService {
  /**
   * Toggles a like for a given entity (song, album, playlist) by a user.
   * @param userId - The ID of the user.
   * @param entityId - The ID of the entity to like/unlike.
   * @param entity - The type of entity (song, album, playlist).
   * @return A string indicating the action ("liked"/"unliked"), or null if entity type is invalid.
   * @throws Error if the operation fails or if the entity type is invalid.
   */
  static async toggleLike(
    userId: UUID,
    entityId: UUID,
    entity: Entity
  ): Promise<string | null> {
    try {
      if (
        !(await validateMany([
          { id: userId, type: "user" },
          { id: entityId, type: entity },
        ]))
      ) {
        throw new Error("Invalid user ID or entity ID");
      }

      const table = LIKE_FUNCTIONS[entity];

      if (!table) {
        throw new Error("Invalid entity type");
      }

      // Use PG RPC function to toggle like and return action
      // action is either "liked" or "unliked"
      // Atomic and thread safe
      const res = await query(`SELECT action FROM ${table}($1, $2)`, [
        userId,
        entityId,
      ]);
      return res[0]?.action ?? null;
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }
}
