import api from "./api";
import type { AlbumSong, UUID, User } from "@types";

export const albumApi = {
  async getSongs(
    id: UUID,
    options?: {
      includeArtists?: boolean;
      includeLikes?: boolean;
      limit?: number;
      offset?: number;
    },
  ) {
    const response = await api.get<AlbumSong[]>(`/albums/${id}/songs`, {
      params: options,
    });
    return response.data;
  },

  async getLikedBy(
    id: UUID,
    options?: {
      limit?: number;
      offset?: number;
    },
  ) {
    const response = await api.get<User[]>(`/albums/${id}/liked-by`, {
      params: options,
    });
    return response.data;
  },
};
