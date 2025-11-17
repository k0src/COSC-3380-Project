import type { Song, Album, User, Artist, Playlist } from "@types";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export interface SearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  users: User[];
}

/**
 * Service for handling search for songs, albums, artists, playlists, and users.
 */
export default class SearchService {
  private static isAllTypeQuery(
    q: string,
    type: "songs" | "albums"
  ): boolean {
    const normalized = (q ?? "").trim().toLowerCase();
    if (type === "songs") {
      return normalized === "song" || normalized === "songs";
    }
    if (type === "albums") {
      return normalized === "album" || normalized === "albums";
    }
    return false;
  }

  /**
   * Searches for songs, albums, artists, playlists, and users matching the query.
   * @param q The search query string.
   * @returns An object containing arrays of matching songs, albums, artists, playlists, and users.
   */
  static async search(q: string): Promise<SearchResults> {
    try {
      const qLower = (q ?? "").trim().toLowerCase();
      const songsWhere = this.isAllTypeQuery(qLower, "songs")
        ? "TRUE"
        : "s.title ILIKE $1 OR s.genre ILIKE $1";
      const albumsWhere = this.isAllTypeQuery(qLower, "albums")
        ? "TRUE"
        : "a.title ILIKE $1";

      const results = await query(
        `
        SELECT
          (SELECT json_agg(s) FROM songs s WHERE ${songsWhere}) AS songs,
          (SELECT json_agg(a) FROM albums a WHERE ${albumsWhere}) AS albums,
          (SELECT json_agg(ar) FROM artists ar WHERE ar.display_name ILIKE $1 OR ar.bio ILIKE $1) AS artists,
          (SELECT json_agg(p) FROM playlists p WHERE p.title ILIKE $1) AS playlists,
          (SELECT json_agg(u) FROM users u WHERE u.username ILIKE $1) AS users
        `,
        [`%${q}%`]
      );

      if (!results || results.length === 0) {
        return {
          songs: [],
          albums: [],
          artists: [],
          playlists: [],
          users: [],
        };
      }

      const row = results[0];

      const songs: Song[] = row.songs
        ? await Promise.all(
            row.songs.map(async (song: Song) => {
              if (song.image_url) {
                song.image_url = getBlobUrl(song.image_url);
              }
              if (song.audio_url) {
                song.audio_url = getBlobUrl(song.audio_url);
              }
              song.type = "song";
              return song;
            })
          )
        : [];
      const albums: Album[] = row.albums
        ? await Promise.all(
            row.albums.map(async (album: Album) => {
              if (album.image_url) {
                album.image_url = getBlobUrl(album.image_url);
              }
              album.type = "album";
              return album;
            })
          )
        : [];
      const artists: Artist[] = row.artists
        ? await Promise.all(
            row.artists.map(async (artist: Artist) => {
              artist.type = "artist";
              return artist;
            })
          )
        : [];
      const playlists: Playlist[] = row.playlists
        ? await Promise.all(
            row.playlists.map(async (playlist: Playlist) => {
              if (!playlist.image_url) {
                if (!playlist.image_url) {
                  playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
                }
              }
              playlist.type = "playlist";
              return playlist;
            })
          )
        : [];
      const users: User[] = row.users
        ? await Promise.all(
            row.users.map(async (user: User) => {
              if (user.profile_picture_url) {
                user.profile_picture_url = getBlobUrl(user.profile_picture_url);
              }
              return user;
            })
          )
        : [];

      return {
        songs,
        albums,
        artists,
        playlists,
        users,
      };
    } catch (error) {
      console.error("Search failed:", error);
      throw error;
    }
  }

  /**
   * Searches for users matching the query.
   * @param q The search query string.
   * @returns An array of matching users.
   */
  static async searchUsers(q: string): Promise<User[]> {
    try {
      const results = await query(
        `SELECT * FROM users u
        WHERE u.username ILIKE $1`,
        [`%${q}%`]
      );

      if (!results || results.length === 0) {
        return [];
      }

      const processedUsers: User[] = await Promise.all(
        results.map(async (user: User) => {
          if (user.profile_picture_url) {
            user.profile_picture_url = getBlobUrl(user.profile_picture_url);
          }
          return user;
        })
      );

      return processedUsers;
    } catch (error) {
      console.error("Search users failed:", error);
      throw error;
    }
  }

  /**
   * Searches for songs matching the query.
   * @param q The search query string.
   * @returns An array of matching songs.
   */
  static async searchSongs(q: string): Promise<Song[]> {
    try {
      const qLower = (q ?? "").trim().toLowerCase();
      const isAll = this.isAllTypeQuery(qLower, "songs");
      const results = await query(
        `SELECT * FROM songs s
        ${isAll ? "" : "WHERE s.title ILIKE $1 OR s.genre ILIKE $1"}`,
        isAll ? [] : [`%${q}%`]
      );

      if (!results || results.length === 0) {
        return [];
      }

      const processedSongs: Song[] = await Promise.all(
        results.map(async (song: Song) => {
          if (song.image_url) {
            song.image_url = getBlobUrl(song.image_url);
          }
          if (song.audio_url) {
            song.audio_url = getBlobUrl(song.audio_url);
          }
          song.type = "song";
          return song;
        })
      );

      return processedSongs;
    } catch (error) {
      console.error("Search songs failed:", error);
      throw error;
    }
  }

  /**
   * Searches for albums matching the query.
   * @param q The search query string.
   * @returns An array of matching albums.
   */
  static async searchAlbums(q: string): Promise<Album[]> {
    try {
      const qLower = (q ?? "").trim().toLowerCase();
      const isAll = this.isAllTypeQuery(qLower, "albums");
      const results = await query(
        `SELECT * FROM albums a
        ${isAll ? "" : "WHERE a.title ILIKE $1"}`,
        isAll ? [] : [`%${q}%`]
      );

      if (!results || results.length === 0) {
        return [];
      }

      const processedAlbums: Album[] = await Promise.all(
        results.map(async (album: Album) => {
          if (album.image_url) {
            album.image_url = getBlobUrl(album.image_url);
          }
          album.type = "album";
          return album;
        })
      );

      return processedAlbums;
    } catch (error) {
      console.error("Search albums failed:", error);
      throw error;
    }
  }

  /**
   * Searches for playlists matching the query.
   * @param q The search query string.
   * @returns An array of matching playlists.
   */
  static async searchPlaylists(q: string): Promise<Playlist[]> {
    try {
      const results = await query(
        `SELECT * FROM playlists p
        WHERE p.title ILIKE $1`,
        [`%${q}%`]
      );

      if (!results || results.length === 0) {
        return [];
      }

      const processedPlaylists: Playlist[] = await Promise.all(
        results.map(async (playlist: Playlist) => {
          if (!playlist.image_url) {
            if (!playlist.image_url) {
              playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
            }
          }
          playlist.type = "playlist";
          return playlist;
        })
      );

      return processedPlaylists;
    } catch (error) {
      console.error("Search playlists failed:", error);
      throw error;
    }
  }

  /**
   * Searches for artists matching the query.
   * @param q The search query string.
   * @returns An array of matching artists.
   */
  static async searchArtists(q: string): Promise<Artist[]> {
    try {
      const results = await query(
        `SELECT 
          ar.*,
          row_to_json(u) AS user
        FROM artists ar
        LEFT JOIN users u ON ar.user_id = u.id
        WHERE ar.display_name ILIKE $1 OR ar.bio ILIKE $1`,
        [`%${q}%`]
      );

      if (!results || results.length === 0) {
        return [];
      }

      const processedArtists: Artist[] = await Promise.all(
        results.map(async (artist: Artist) => {
          if (artist.user?.profile_picture_url) {
            artist.user.profile_picture_url = getBlobUrl(
              artist.user.profile_picture_url
            );
          }
          artist.type = "artist";
          return artist;
        })
      );

      return processedArtists;
    } catch (error) {
      console.error("Search artists failed:", error);
      throw error;
    }
  }
}
