import api from "./api";
import type { Song, UUID, CoverGradient, SuggestedSong } from "../types";

export const songApi = {
  async getSongById(
    id: UUID,
    options?: {
      includeAlbums?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
    }
  ) {
    const response = await api.get<Song>(`/songs/${id}`, {
      params: options,
    });
    return response.data;
  },

  async getSuggestedSongs(
    id: UUID,
    options?: { userId?: UUID; limit?: number }
  ) {
    const response = await api.get<SuggestedSong[]>(
      `/songs/${id}/suggestions`,
      {
        params: options,
      }
    );
    return response.data;
  },

  async incrementSongStreams(id: UUID) {
    await api.put(`/songs/${id}/streams`);
  },

  async getCoverGradient(id: UUID) {
    const response = await api.get<CoverGradient>(
      `/songs/${id}/cover-gradient`
    );
    return response.data;
  },
};