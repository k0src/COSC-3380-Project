import api from "./api";
import type { ArtistSong, UUID } from "../types";

export const artistApi = {
  async getSongs(
    id: UUID,
    options?: {
      includeAlbum?: boolean;
      includeLikes?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<ArtistSong[]>(`/artists/${id}/songs`, {
      params: options,
    });
    return response.data;
  },
};
