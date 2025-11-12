import api from "./api";
import type {
  Song,
  UUID,
  CoverGradient,
  SuggestedSong,
  WeeklyPlays,
  User,
} from "@types";

export const songApi = {
  async getSongById(
    id: UUID,
    options?: {
      includeAlbums?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
      includeComments?: boolean;
    }
  ) {
    const response = await api.get<Song>(`/songs/${id}`, {
      params: options,
    });
    return response.data;
  },

  async getMany(options?: {
    includeAlbums?: boolean;
    includeArtists?: boolean;
    includeLikes?: boolean;
    includeComments?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get<Song[]>(`/songs`, {
      params: options,
    });
    return response.data;
  },

  async getSuggestedSongs(
    id: UUID,
    options?: {
      userId?: UUID;
      includeAlbums?: boolean;
      includeArtists?: boolean;
      includeLikes?: boolean;
      includeComments?: boolean;
      limit?: number;
      offset?: number;
    }
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

  async getWeeklyPlays(id: UUID) {
    const response = await api.get<WeeklyPlays>(`/songs/${id}/weekly-plays`);
    return response.data;
  },

  async getLikedBy(
    id: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<User[]>(`/songs/${id}/liked-by`, {
      params: options,
    });
    return response.data;
  },
};
