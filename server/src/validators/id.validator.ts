import type { UUID } from "@types";
import { query } from "@config/database.js";

const VALID_TABLES = [
  "users",
  "songs",
  "albums",
  "artists",
  "playlists",
  "comments",
];

/**
 * Validates if a given ID exists in the specified table.
 * @param table - The name of the table to check.
 * @param id - The UUID to validate.
 * @return True if the ID exists, false otherwise.
 * @throws Error if the table name is invalid or the query fails.
 */
async function validateId(table: string, id: UUID): Promise<boolean> {
  try {
    if (!VALID_TABLES.includes(table)) {
      throw new Error("Invalid table name");
    }

    const res = await query(
      `SELECT EXISTS(SELECT 1 FROM ${table} WHERE id = $1)`,
      [id]
    );
    return Boolean(res[0]?.exists);
  } catch (error) {
    throw new Error(`Error validating ${table} ID`);
  }
}

export const validateUserId = (id: UUID) => validateId("users", id);
export const validateSongId = (id: UUID) => validateId("songs", id);
export const validateAlbumId = (id: UUID) => validateId("albums", id);
export const validateArtistId = (id: UUID) => validateId("artists", id);
export const validatePlaylistId = (id: UUID) => validateId("playlists", id);
export const validateCommentId = (id: UUID) => validateId("comments", id);
