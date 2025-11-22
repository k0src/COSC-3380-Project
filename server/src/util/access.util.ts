import type { AccessContext } from "@types";
import { isUuidV4 } from "@validators";

export const parseAccessContext = (query: any): AccessContext => {
  const role = typeof query.role === "string" ? query.role : "anonymous";
  const userId = typeof query.userId === "string" ? query.userId : undefined;
  const scope = typeof query.scope === "string" ? query.scope : "globalList";
  return { role, userId, scope };
};

export interface AccessPredicate {
  sql: string;
  params: any[];
}

const DELETED_TABLE_MAP: Record<string, { table: string; column: string }> = {
  s: { table: "deleted_songs", column: "song_id" },
  a: { table: "deleted_albums", column: "album_id" },
  p: { table: "deleted_playlists", column: "playlist_id" },
};

export const getAccessPredicate = (
  ctx: AccessContext,
  tableAlias: string,
  paramsOffset = 0
): AccessPredicate => {
  if (ctx.userId && !isUuidV4(ctx.userId)) {
    throw new Error("Invalid UUID for userId in AccessContext");
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableAlias)) {
    throw new Error("Invalid table alias");
  }

  const deletedInfo = DELETED_TABLE_MAP[tableAlias];
  const deletedCheck = deletedInfo
    ? `${tableAlias}.id NOT IN (SELECT ${deletedInfo.column} FROM ${deletedInfo.table})`
    : null;

  let accessSql = "";
  let params: any[] = [];

  switch (ctx.role) {
    case "admin":
      accessSql = "TRUE";
      break;

    default:
      switch (ctx.scope) {
        case "single":
          if (ctx.role === "anonymous") {
            accessSql = `(${tableAlias}.visibility_status IN ('PUBLIC','UNLISTED'))`;
          } else {
            accessSql = `(
              ${tableAlias}.visibility_status IN ('PUBLIC','UNLISTED')
              OR (${tableAlias}.visibility_status = 'PRIVATE' AND ${tableAlias}.owner_id = $${
              paramsOffset + 1
            }))`;
            params = [ctx.userId];
          }
          break;

        case "globalList":
          accessSql = `${tableAlias}.visibility_status = 'PUBLIC'`;
          break;

        case "ownerList":
          accessSql = `(
            ${tableAlias}.visibility_status IN ('PUBLIC','UNLISTED')
            OR ${tableAlias}.owner_id = $${paramsOffset + 1}
          )`;
          params = [ctx.userId];
          break;

        default:
          accessSql = "FALSE";
          break;
      }
      break;
  }

  if (deletedCheck) {
    accessSql = `(${accessSql} AND ${deletedCheck})`;
  }

  return { sql: accessSql, params };
};
