import type { SongArtist } from "@types";

export const getMainArtist = (artists: SongArtist[]) => {
  return artists.find((artist) => artist.role === "Main") || artists[0];
};
