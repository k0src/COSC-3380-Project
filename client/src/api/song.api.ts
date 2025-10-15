import api from "./api";
import type { Song, UUID, CoverGradient } from "../types";

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

  async getCoverGradient(id: UUID) {
    const response = await api.get<CoverGradient>(
      `/songs/${id}/cover-gradient`
    );
    return response.data;
  },
};
