import api from "./api";
import type { Song, UUID } from "../types";

export const songApi = {
  async getSongById(
    id: UUID,
    options?: {
      includeAlbum?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
    }
  ) {
    const response = await api.get<Song>(
      `/songs/${id}?` +
        new URLSearchParams({
          includeAlbum: options?.includeAlbum ? "true" : "false",
          includeArtists: options?.includeArtists ? "true" : "false",
          includeLikes: options?.includeLikes ? "true" : "false",
        })
    );
    return response.data;
  },
};
