import api from "./api";
import type {
  Artist,
  ArtistSong,
  UUID,
  Album,
  Playlist,
  AccessContext,
  Song,
  ArtistOrderByColumn,
  OrderByDirection,
  SongOrderByColumn,
  AlbumOrderByColumn,
  PlaylistOrderByColumn,
} from "@types";

export const artistApi = {
  async create(data: {
    user_id: UUID;
    display_name: string;
    bio?: string;
    location?: string;
    banner_image_url?: File | null;
  }) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const response = await api.post<Artist>(`/artists`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async update(
    artistId: UUID,
    data: {
      user_id: UUID;
      display_name?: string;
      bio?: string;
      location?: string;
      banner_image_url?: File | null;
    }
  ) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const response = await api.put<Artist>(`/artists/${artistId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async delete(artistId: UUID) {
    const response = await api.delete(`/artists/${artistId}`);
    return response.data;
  },

  async getArtistDetails(artistId: UUID, accessContext: AccessContext) {
    try {
      const response = await api.get<Artist>(`/artists/${artistId}`, {
        params: {
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

  async getManyArtists(
    accessContext: AccessContext,
    options?: {
      orderByColumn?: ArtistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Artist[]>(`/artists`, {
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

  async getSongs(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: SongOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<ArtistSong[]>(
        `/artists/${artistId}/songs`,
        {
          params: {
            ...options,
            role: accessContext.role,
            userId: accessContext.userId,
            scope: accessContext.scope,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getSingles(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: SongOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<ArtistSong[]>(
        `/artists/${artistId}/singles`,
        {
          params: {
            ...options,
            role: accessContext.role,
            userId: accessContext.userId,
            scope: accessContext.scope,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getAlbums(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: AlbumOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Album[]>(`/artists/${artistId}/albums`, {
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

  async getArtistPlaylists(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: PlaylistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Playlist[]>(
        `/artists/${artistId}/artist-playlists`,
        {
          params: {
            ...options,
            role: accessContext.role,
            userId: accessContext.userId,
            scope: accessContext.scope,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getRelatedArtists(
    artistId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Artist[]>(`/artists/${artistId}/related`, {
      params: options,
    });
    return response.data;
  },

  async getFeaturedOnPlaylists(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: PlaylistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Playlist[]>(
        `/artists/${artistId}/playlists`,
        {
          params: {
            ...options,
            role: accessContext.role,
            userId: accessContext.userId,
            scope: accessContext.scope,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getArtistRecommendations(
    userId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Artist[]>(
        `/artists/recommendations/${userId}`,
        { params: options }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getNewFromFollowedArtists(
    userId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: SongOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Song[]>(
        `/artists/recommendations/${userId}/followed/songs`,
        {
          params: {
            ...options,
            role: accessContext.role,
            userId: accessContext.userId,
            scope: accessContext.scope,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
    }
  },

  async getPinnedAlbum(artistId: UUID, accessContext: AccessContext) {
    try {
      const response = await api.get<Album>(
        `/artists/${artistId}/pinned-album`,
        {
          params: {
            role: accessContext.role,
            userId: accessContext.userId,
            scope: accessContext.scope,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getNumberOfSongs(id: UUID) {
    const response = await api.get<{ numberOfSongs: number }>(
      `/artists/${id}/count/songs`
    );
    return response.data.numberOfSongs;
  },

  async getTotalStreams(id: UUID) {
    const response = await api.get<{ streams: number }>(
      `/artists/${id}/count/streams`
    );
    return response.data.streams;
  },

  async getMonthlyListeners(id: UUID) {
    const response = await api.get<{ monthlyListeners: number }>(
      `/artists/${id}/count/monthly-listeners`
    );
    return response.data.monthlyListeners;
  },

  async pinAlbumToArtistPage(artistId: UUID, albumId: UUID) {
    const response = await api.post(`/artists/${artistId}/pin-album`, {
      albumId,
    });
    return response.data;
  },

  async unPinAlbumFromArtistPage(artistId: UUID, albumId: UUID) {
    const response = await api.post(`/artists/${artistId}/unpin-album`, {
      albumId,
    });
    return response.data;
  },

  async checkArtistHasArtistPlaylists(artistId: UUID) {
    const response = await api.get<{ hasPlaylists: boolean }>(
      `/artists/${artistId}/has/artist-playlists`
    );
    return response.data;
  },

  async checkArtistHasSongs(artistId: UUID) {
    const response = await api.get<{ hasSongs: boolean }>(
      `/artists/${artistId}/has/songs`
    );
    return response.data;
  },

  async getTopArtist(days: number = 30) {
    const response = await api.get<Artist>(`/artists/top-artist`, {
      params: { days },
    });
    return response.data;
  },
};
