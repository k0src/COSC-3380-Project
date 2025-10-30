import api from "./api";
import type { AlbumSong, UUID } from "@types";

export const albumApi = {
  async getSongs(
    id: UUID,
    options?: {
      includeArtist?: boolean;
      includeLikes?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<AlbumSong[]>(`/albums/${id}/songs`, {
      params: options,
    });
    return response.data;
  },
};
