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

  switch (ctx.role) {
    case "admin":
      return { sql: "TRUE", params: [] };

    default:
      break;
  }

  switch (ctx.scope) {
    case "single":
      if (ctx.role === "anonymous") {
        return {
          sql: `(${tableAlias}.visibility_status IN ('PUBLIC','UNLISTED'))`,
          params: [],
        };
      }
      return {
        sql: `(
          ${tableAlias}.visibility_status IN ('PUBLIC','UNLISTED')
          OR (${tableAlias}.visibility_status = 'PRIVATE' AND ${tableAlias}.owner_id = $${
          paramsOffset + 1
        }))`,
        params: [ctx.userId],
      };

    case "globalList":
      return { sql: `${tableAlias}.visibility_status = 'PUBLIC'`, params: [] };

    case "ownerList":
      return {
        sql: `(
          ${tableAlias}.visibility_status IN ('PUBLIC','UNLISTED')
          OR ${tableAlias}.owner_id = $${paramsOffset + 1}
        )`,
        params: [ctx.userId],
      };

    default:
      return { sql: "FALSE", params: [] };
  }
};
