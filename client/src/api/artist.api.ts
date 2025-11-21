import api from "./api";
import type {
  Artist,
  ArtistSong,
  UUID,
  Album,
  User,
  Playlist,
  AccessContext,
  SongOptions,
  AlbumOptions,
  PlaylistOptions,
} from "@types";

export const artistApi = {
  async getArtistById(
    id: UUID,
    options?: {
      includeUser?: boolean;
    }
  ) {
    const response = await api.get<Artist>(`/artists/${id}`, {
      params: options,
    });
    return response.data;
  },

  async getSongs(
    id: UUID,
    accessContext: AccessContext,
    options?: SongOptions
  ) {
    const response = await api.get<ArtistSong[]>(`/artists/${id}/songs`, {
      params: {
        ...options,
        role: accessContext.role,
        userId: accessContext.userId,
        scope: accessContext.scope,
      },
    });
    return response.data;
  },

  async getAlbums(
    id: UUID,
    accessContext: AccessContext,
    options?: AlbumOptions
  ) {
    const response = await api.get<Album[]>(`/artists/${id}/albums`, {
      params: {
        ...options,
        role: accessContext.role,
        userId: accessContext.userId,
        scope: accessContext.scope,
      },
    });
    return response.data;
  },

  async getArtistPlaylists(
    id: UUID,
    accessContext: AccessContext,
    options?: PlaylistOptions
  ) {
    const response = await api.get<Playlist[]>(
      `/artists/${id}/artist-playlists`,
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
  },

  async getRelatedArtists(
    id: UUID,
    options?: {
      includeUser?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Artist[]>(`/artists/${id}/related`, {
      params: options,
    });
    return response.data;
  },

  async getNumberOfSongs(id: UUID) {
    const response = await api.get<{ numberOfSongs: number }>(
      `/artists/${id}/number-songs`
    );
    return response.data.numberOfSongs;
  },

  async getNumberOfAlbums(id: UUID) {
    const response = await api.get<{ numberOfAlbums: number }>(
      `/artists/${id}/number-albums`
    );
    return response.data.numberOfAlbums;
  },

  async getNumberOfSingles(id: UUID) {
    const response = await api.get<{ numberOfSingles: number }>(
      `/artists/${id}/number-singles`
    );
    return response.data.numberOfSingles;
  },

  async getTotalStreams(id: UUID) {
    const response = await api.get<{ streams: number }>(
      `/artists/${id}/streams`
    );
    return response.data.streams;
  },

  async getFollowers(
    id: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<User[]>(`/artists/${id}/followers`, {
      params: options,
    });
    return response.data;
  },

  async getFollowing(
    id: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<User[]>(`/artists/${id}/following`, {
      params: options,
    });
    return response.data;
  },

  async getFollowerCount(id: UUID) {
    const response = await api.get<{ followerCount: number }>(
      `/artists/${id}/followers/count`
    );
    return response.data.followerCount;
  },

  async getFollowingCount(id: UUID) {
    const response = await api.get<{ followingCount: number }>(
      `/artists/${id}/following/count`
    );
    return response.data.followingCount;
  },

  async getPlaylists(
    id: UUID,
    options?: {
      includeUser?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Playlist[]>(`/artists/${id}/playlists`, {
      params: options,
    });
    return response.data;
  },

  async getMonthlyListeners(id: UUID) {
    const response = await api.get<{ monthlyListeners: number }>(
      `/artists/${id}/monthly-listeners`
    );
    return response.data.monthlyListeners;
  },

  async create(data: {
    user_id: UUID;
    display_name: string;
    bio: string;
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

  async checkArtistHasPlaylists(artistId: UUID) {
    const response = await api.get<{ hasPlaylists: boolean }>(
      `/artists/${artistId}/has-artist-playlists`
    );
    return response.data;
  },
};
