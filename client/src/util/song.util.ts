import type { SongArtist } from "@types";

export const getMainArtist = (artists: SongArtist[]) => {
  if (!artists || artists.length === 0) return artists[0];
  return artists.find((artist) => artist.role === "Main") || artists[0];
};

export const getArtistListString = (artists: SongArtist[]) => {
  if (!artists || artists.length === 0) return "";
  return artists
    .sort((a, b) => {
      if (a.role === "Main" && b.role !== "Main") return -1;
      if (a.role !== "Main" && b.role === "Main") return 1;
      return 0;
    })
    .map((artist) => artist.display_name)
    .join(", ");
};
