export type ReportEntity =
  | "USER"
  | "ARTIST"
  | "ALBUM"
  | "SONG"
  | "PLAYLIST";

export type ReportType = "EXPLICIT" | "VIOLENT" | "HATEFUL" | "COPYRIGHT";

export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";