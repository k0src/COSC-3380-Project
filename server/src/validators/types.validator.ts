const VALID_ORDER_BY_COLUMNS = {
  song: [
    "title",
    "created_at",
    "streams",
    "release_date",
    "likes",
    "comments",
    "duration",
  ],
  album: [
    "title",
    "created_at",
    "release_date",
    "likes",
    "runtime",
    "song_count",
  ],
  artist: ["name", "created_at", "verified"],
  playlist: ["title", "created_at", "likes", "song_count", "runtime"],
  user: ["username", "created_at", "role"],
  comment: ["commented_at", "likes"],
  report: ["reported_at", "report_type", "report_status"],
  appeal: ["submitted_at", "appeal_status"],
};

const VALID_ORDER_BY_DIRECTIONS = ["ASC", "DESC"];

export function validateOrderBy(
  column: string,
  direction: string,
  entityType:
    | "song"
    | "album"
    | "artist"
    | "playlist"
    | "user"
    | "comment"
    | "report"
    | "appeal",
  extraColumns?: string[]
): boolean {
  if (!VALID_ORDER_BY_DIRECTIONS.includes(direction as any)) {
    return false;
  }
  const validColumns = VALID_ORDER_BY_COLUMNS[entityType];
  if (extraColumns) {
    validColumns.push(...extraColumns);
  }
  return validColumns.includes(column);
}
