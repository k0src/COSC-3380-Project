const VALID_ORDER_BY_COLUMNS = {
  song: [
    "title",
    "created_at",
    "streams",
    "release_date",
    "likes",
    "comments",
    "duration",
  ] as const,
  album: [
    "title",
    "created_at",
    "release_date",
    "likes",
    "runtime",
    "song_count",
  ] as const,
  artist: ["name", "created_at", "verified", "streams"] as const,
  playlist: ["title", "created_at", "likes", "song_count"] as const,
} as const;

const VALID_ORDER_BY_DIRECTIONS = ["ASC", "DESC"] as const;

export type SongOrderByColumn = (typeof VALID_ORDER_BY_COLUMNS.song)[number];
export type AlbumOrderByColumn = (typeof VALID_ORDER_BY_COLUMNS.album)[number];
export type ArtistOrderByColumn =
  (typeof VALID_ORDER_BY_COLUMNS.artist)[number];
export type PlaylistOrderByColumn =
  (typeof VALID_ORDER_BY_COLUMNS.playlist)[number];
export type OrderByDirection = (typeof VALID_ORDER_BY_DIRECTIONS)[number];

export function validateOrderBy(
  column: string,
  direction: string,
  entityType: "song" | "album" | "artist" | "playlist"
): boolean {
  if (!VALID_ORDER_BY_DIRECTIONS.includes(direction as any)) {
    return false;
  }
  const validColumns = VALID_ORDER_BY_COLUMNS[entityType];
  return validColumns.includes(column as any);
}
