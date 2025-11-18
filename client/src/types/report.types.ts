/**
 * "ARTISTS" CAN BE REPORTED ON THE SITE, SO "ARTIST" IS INCLUDED IN THE REPORTABLE TYPE, HOWEVER, YOU MUST USE ARTIST.USER_ID FOR THE ID!
 */
export type ReportableEntity =
  | "user"
  | "artist"
  | "album"
  | "song"
  | "playlist";

export type ReportType = "EXPLICIT" | "VIOLENT" | "HATEFUL" | "COPYRIGHT";
