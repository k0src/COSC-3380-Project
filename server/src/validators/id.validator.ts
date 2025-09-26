import type { UUID } from "@types";
import { query } from "../config/database.js";

/**
 * Check if user ID exists in the database.
 * @param id The user ID to validate.
 * @return True if the user ID exists, false otherwise.
 * @throws Error if the operation fails.
 */
export async function validateUserId(id: UUID): Promise<boolean> {
  try {
    const res = await query(
      "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)",
      [id]
    );
    return Boolean(res[0]?.exists);
  } catch (error) {
    throw new Error("Error validating user ID");
  }
}

/**
 * Check if song ID exists in the database.
 * @param id The song ID to validate.
 * @return True if the song ID exists, false otherwise.
 * @throws Error if the operation fails.
 */
export async function validateSongId(id: UUID): Promise<boolean> {
  try {
    const res = await query(
      "SELECT EXISTS(SELECT 1 FROM songs WHERE id = $1)",
      [id]
    );
    return Boolean(res[0]?.exists);
  } catch (error) {
    throw new Error("Error validating song ID");
  }
}

/**
 * Check if album ID exists in the database.
 * @param id The album ID to validate.
 * @return True if the album ID exists, false otherwise.
 * @throws Error if the operation fails.
 */
export async function validateAlbumId(id: UUID): Promise<boolean> {
  try {
    const res = await query(
      "SELECT EXISTS(SELECT 1 FROM albums WHERE id = $1)",
      [id]
    );
    return Boolean(res[0]?.exists);
  } catch (error) {
    throw new Error("Error validating album ID");
  }
}

/**
 * Check if artist ID exists in the database.
 * @param id The artist ID to validate.
 * @return True if the artist ID exists, false otherwise.
 * @throws Error if the operation fails.
 */
export async function validateArtistId(id: UUID): Promise<boolean> {
  try {
    const res = await query(
      "SELECT EXISTS(SELECT 1 FROM artists WHERE id = $1)",
      [id]
    );
    return Boolean(res[0]?.exists);
  } catch (error) {
    throw new Error("Error validating artist ID");
  }
}

/**
 * Check if playlist ID exists in the database.
 * @param id The playlist ID to validate.
 * @return True if the playlist ID exists, false otherwise.
 * @throws Error if the operation fails.
 */
export async function validatePlaylistId(id: UUID): Promise<boolean> {
  try {
    const res = await query(
      "SELECT EXISTS(SELECT 1 FROM playlists WHERE id = $1)",
      [id]
    );
    return Boolean(res[0]?.exists);
  } catch (error) {
    throw new Error("Error validating playlist ID");
  }
}

/**
 * Check if comment ID exists in the database.
 * @param id The comment ID to validate.
 * @return True if the comment ID exists, false otherwise.
 * @throws Error if the operation fails.
 */
export async function validateCommentId(id: UUID): Promise<boolean> {
  try {
    const res = await query(
      "SELECT EXISTS(SELECT 1 FROM comments WHERE id = $1)",
      [id]
    );
    return Boolean(res[0]?.exists);
  } catch (error) {
    throw new Error("Error validating comment ID");
  }
}

// Helper types and functions for validateMany
type ValidatorFn = (id: UUID) => Promise<boolean>;
type Entity = "user" | "song" | "album" | "artist" | "playlist" | "comment";
interface Validatable {
  id: UUID;
  type: Entity;
}

const getValidator = (type: Entity): ValidatorFn | null => {
  switch (type) {
    case "user":
      return validateUserId;
    case "song":
      return validateSongId;
    case "album":
      return validateAlbumId;
    case "artist":
      return validateArtistId;
    case "playlist":
      return validatePlaylistId;
    case "comment":
      return validateCommentId;
    default:
      return null;
  }
};

/**
 * Validate multiple IDs of different types.
 * @param ids An array of objects containing the ID and its type.
 * @return False if any ID is invalid, true if all are valid.
 * @throws Error if any database query fails.
 */
export async function validateMany(ids: Validatable[]): Promise<boolean> {
  const results = await Promise.all(
    ids.map((id) => {
      const validator = getValidator(id.type);
      return validator ? validator(id.id) : Promise.resolve(false);
    })
  );
  return results.every(Boolean);
}

export default {
  validateUserId,
  validateSongId,
  validateAlbumId,
  validateArtistId,
  validatePlaylistId,
  validateCommentId,
  validateMany,
};
