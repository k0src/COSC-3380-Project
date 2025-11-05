import api from "./api";
import type { Artist, ArtistSong, UUID, Album, User, Playlist } from "@types";

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
    options?: {
      includeArtists?: boolean;
      includeAlbums?: boolean;
      onlySingles?: boolean;
      includeLikes?: boolean;
      includeComments?: boolean;
      orderByColumn?:
        | "title"
        | "created_at"
        | "streams"
        | "release_date"
        | "likes"
        | "comments"
        | "duration";
      orderByDirection?: "ASC" | "DESC";
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<ArtistSong[]>(`/artists/${id}/songs`, {
      params: options,
    });
    return response.data;
  },

  async getAlbums(
    id: UUID,
    options?: {
      includeLikes?: boolean;
      includeRuntime?: boolean;
      includeSongCount?: boolean;
      orderByColumn?:
        | "title"
        | "created_at"
        | "release_date"
        | "likes"
        | "runtime"
        | "songCount";
      orderByDirection?: "ASC" | "DESC";
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Album[]>(`/artists/${id}/albums`, {
      params: options,
    });
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
      `/artists/${id}/follower-count`
    );
    return response.data.followerCount;
  },

  async getFollowingCount(id: UUID) {
    const response = await api.get<{ followingCount: number }>(
      `/artists/${id}/following-count`
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
};
