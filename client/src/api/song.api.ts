import api from "./api";
import type {
  Song,
  UUID,
  CoverGradient,
  SuggestedSong,
  WeeklyPlays,
  User,
  SongOptions,
  AccessContext,
} from "@types";

export const songApi = {
  async getSongById(
    id: UUID,
    accessContext: AccessContext,
    options?: SongOptions
  ) {
    try {
      const response = await api.get<Song>(`/songs/${id}`, {
        params: {
          ...options,
          role: accessContext.role,
          userId: accessContext.userId,
          scope: accessContext.scope,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getMany(accessContext: AccessContext, options?: SongOptions) {
    try {
      const response = await api.get<Song[]>(`/songs`, {
        params: {
          ...options,
          role: accessContext.role,
          userId: accessContext.userId,
          scope: accessContext.scope,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
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

  async create(
    data: {
      title: string;
      owner_id: UUID;
      album_id?: UUID;
      artists: { id: UUID; role: string }[];
      genre: string;
      release_date: string;
      visibility_status: string;
      image_url?: File | null;
      audio_url: File;
    },
    onUploadProgress?: (progressEvent: any) => void
  ) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const response = await api.post<Song>(`/songs`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    return response.data;
  },

  async update(
    songId: UUID,
    data: {
      title?: string;
      genre?: string;
      release_date?: string;
      visibility_status?: string;
      image_url?: File | null;
    }
  ) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const reponse = await api.put<Song>(`/songs/${songId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return reponse.data;
  },

  async delete(songId: UUID) {
    const response = await api.delete(`/songs/${songId}`);
    return response.data;
  },
};
