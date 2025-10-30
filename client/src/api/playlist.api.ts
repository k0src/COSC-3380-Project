import api from "./api";
import type { PlaylistSong, UUID } from "@types";

export const playlistApi = {
  async getSongs(
    id: UUID,
    options?: {
      includeAlbums?: boolean;
      includeArtists?: boolean;
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
