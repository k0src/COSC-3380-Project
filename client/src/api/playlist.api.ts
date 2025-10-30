import api from "./api";
import type { PlaylistSong, UUID } from "@types";

export const playlistApi = {
  async getSongs(
    id: UUID,
    options?: {
      includeAlbum?: boolean;
      includeArtist?: boolean;
      includeLikes?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<PlaylistSong[]>(`/playlists/${id}/songs`, {
      params: options,
    });
    return response.data;
  },
};
