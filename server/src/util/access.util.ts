import type { AccessContext, UUID } from "@types";
import { query } from "@config/database.js";

export type DeletableEntityType =
  | "song"
  | "album"
  | "playlist"
  | "artist"
  | "user"
  | "comment";

export type RemovableEntityType = "song" | "album" | "playlist" | "user";

export async function isDeleted(id: UUID, type: DeletableEntityType) {
  try {
    const res = await query(
      `SELECT 1 FROM deleted_${type}s 
      WHERE ${type}_id = $1 
      LIMIT 1`,
      [id]
    );

    return Array.isArray(res) && res.length > 0;
  } catch (error) {
    console.error("Error checking deletion status:", error);
    throw error;
  }
}

/**
 * Checks if song, album, or playlist is 'UNLISTED' or user is 'SUSPENDED'
 */
export async function isRemoved(id: UUID, type: RemovableEntityType) {
  try {
    let sql = "";

    if (type === "user") {
      sql = "SELECT status FROM users WHERE id = $1 LIMIT 1";
    } else {
      sql = `SELECT visibility_status FROM ${type}s WHERE id = $1 LIMIT 1`;
    }

    const res = await query(sql, [id]);
    if (Array.isArray(res) && res.length > 0) {
      const statusField =
        type === "user" ? res[0].status : res[0].visibility_status;
      if (type === "user") {
        return statusField === "SUSPENDED";
      } else {
        return statusField === "UNLISTED";
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking removal status:", error);
    throw error;
  }
}

export const parseAccessContext = (query: any): AccessContext => {
  const role = typeof query.role === "string" ? query.role : "anonymous";
  const userId = typeof query.userId === "string" ? query.userId : undefined;
  const scope = typeof query.scope === "string" ? query.scope : "global";
  return { role, userId, scope };
};

export function notDeletedCondition(tableName: string, alias: string): string {
  return `NOT EXISTS (
    SELECT 1 FROM deleted_${tableName}s 
    WHERE ${tableName}_id = ${alias}.id
  )`;
}

export function getVisibilityCondition(
  alias: string,
  visibilityField: string,
  ownerField: string,
  accessContext: AccessContext
): string {
  const { role, userId, scope } = accessContext;
  if (role === "admin" && scope === "owner") {
    return "TRUE";
  }

  if (scope === "global") {
    return `${alias}.${visibilityField} = 'PUBLIC'`;
  }

  if (scope === "owner" && userId) {
    return `(
      ${alias}.${visibilityField} = 'PUBLIC' 
      OR ${alias}.${ownerField} = '${userId}'
    )`;
  }

  return `${alias}.${visibilityField} = 'PUBLIC'`;
}

export function getUserVisibilityCondition(
  userAlias: string,
  accessContext: AccessContext
): string {
  const { role, userId, scope } = accessContext;

  if (role === "admin" && scope === "owner") {
    return "TRUE";
  }

  if (scope === "global") {
    return `(
      ${userAlias}.status = 'ACTIVE' 
      AND ${userAlias}.is_private = FALSE
    )`;
  }

  if (scope === "owner" && userId) {
    return `(
      (${userAlias}.status = 'ACTIVE' AND ${userAlias}.is_private = FALSE)
      OR (${userAlias}.id = '${userId}' AND ${userAlias}.status IN ('ACTIVE', 'DEACTIVATED'))
    )`;
  }

  return `(
    ${userAlias}.status = 'ACTIVE' 
    AND ${userAlias}.is_private = FALSE
  )`;
}
