import type { Song, Album, User, Artist, Playlist, SongArtist } from "@types";
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
  /**
   * Searches for songs, albums, artists, playlists, and users matching the query.
   * @param q The search query string.
   * @returns An object containing arrays of matching songs, albums, artists, playlists, and users.
   */
  static async search(q: string): Promise<SearchResults> {
    try {
      const results = await query(
        `
        SELECT
          (SELECT json_agg(row_to_json(song_with_artists) ORDER BY 
            CASE  
              WHEN LOWER(song_with_artists.title) = LOWER($2) THEN 1
              WHEN LOWER(song_with_artists.title) LIKE LOWER($2) || '%' THEN 2
              ELSE 3
            END,
            song_with_artists.streams DESC NULLS LAST,
            song_with_artists.title
          ) FROM (
            SELECT s.*,
              (SELECT json_agg(row_to_json(ar_with_role))
               FROM (
                 SELECT
                   ar.*,
                   sa.role,
                   row_to_json(u) AS user
                 FROM artists ar
                 JOIN users u ON u.artist_id = ar.id
                 JOIN song_artists sa ON sa.artist_id = ar.id
                 WHERE sa.song_id = s.id
               ) AS ar_with_role
              ) AS artists
            FROM songs s
            WHERE s.title ILIKE $1
          ) AS song_with_artists) AS songs,
          (SELECT json_agg(a ORDER BY 
            CASE 
              WHEN LOWER(a.title) = LOWER($2) THEN 1
              WHEN LOWER(a.title) LIKE LOWER($2) || '%' THEN 2
              ELSE 3
            END,
            a.title
          ) FROM albums a WHERE a.title ILIKE $1) AS albums,
          (SELECT jsonb_agg(
            to_jsonb(ar) || jsonb_build_object('user', to_jsonb(u))
            ORDER BY 
              CASE 
                WHEN LOWER(ar.display_name) = LOWER($2) THEN 1
                WHEN LOWER(ar.display_name) LIKE LOWER($2) || '%' THEN 2
                ELSE 3
              END,
              ar.display_name
          )::json FROM artists ar LEFT JOIN users u ON ar.user_id = u.id WHERE ar.display_name ILIKE $1) AS artists,
          (SELECT json_agg(p ORDER BY 
            CASE 
              WHEN LOWER(p.title) = LOWER($2) THEN 1
              WHEN LOWER(p.title) LIKE LOWER($2) || '%' THEN 2
              ELSE 3
            END,
            p.title
          ) FROM playlists p WHERE p.title ILIKE $1) AS playlists,
          (SELECT json_agg(u ORDER BY 
            CASE 
              WHEN LOWER(u.username) = LOWER($2) THEN 1
              WHEN LOWER(u.username) LIKE LOWER($2) || '%' THEN 2
              ELSE 3
            END,
            u.username
          ) FROM users u WHERE u.username ILIKE $1) AS users
        `,
        [`%${q}%`, q]
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
              // If song has embedded artists, convert profile_picture_url blob and set types
              if (song.artists && song.artists.length > 0) {
                song.artists = song.artists.map((artist: SongArtist) => {
                  if (artist.user && artist.user.profile_picture_url) {
                    artist.user.profile_picture_url = getBlobUrl(
                      artist.user.profile_picture_url
                    );
                  }
                  artist.type = "artist";
                  return artist;
                });
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
              if (artist.user?.profile_picture_url) {
                artist.user.profile_picture_url = getBlobUrl(
                  artist.user.profile_picture_url
                );
              }
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
        WHERE u.username ILIKE $1
        ORDER BY 
          CASE 
            WHEN LOWER(u.username) = LOWER($2) THEN 1
            WHEN LOWER(u.username) LIKE LOWER($2) || '%' THEN 2
            ELSE 3
          END,
          u.username`,
        [`%${q}%`, q]
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
   * @param ownerId Optional user ID to filter by owner.
   * @returns An array of matching songs.
   */
  static async searchSongs(q: string, ownerId?: string): Promise<Song[]> {
    try {
      let sql = `SELECT * FROM songs s WHERE s.title ILIKE $1`;
      const params: any[] = [`%${q}%`];

      if (ownerId) {
        sql += ` AND s.owner_id = $2`;
        params.push(ownerId);
      }

      const results = await query(sql, params);

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
   * @param ownerId Optional user ID to filter by owner.
   * @returns An array of matching albums.
   */
  static async searchAlbums(q: string, ownerId?: string): Promise<Album[]> {
    try {
      let sql = `SELECT * FROM albums a WHERE a.title ILIKE $1`;
      const params: any[] = [`%${q}%`];

      if (ownerId) {
        sql += ` AND a.owner_id = $2`;
        params.push(ownerId);
      }

      const results = await query(sql, params);

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
   * @param ownerId Optional user ID to filter by owner (created_by).
   * @returns An array of matching playlists.
   */
  static async searchPlaylists(
    q: string,
    ownerId?: string
  ): Promise<Playlist[]> {
    try {
      let sql = `SELECT * FROM playlists p WHERE p.title ILIKE $1`;
      const params: any[] = [`%${q}%`];

      if (ownerId) {
        sql += ` AND p.created_by = $2`;
        params.push(ownerId);
      }

      const results = await query(sql, params);

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
          ar.id,
          ar.display_name,
          ar.bio,
          ar.user_id,
          ar.created_at,
          ar.verified,
          ar.location,
          ar.banner_image_url,
          ar.banner_image_url_blurhash,
          json_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email,
            'role', u.role,
            'profile_picture_url', u.profile_picture_url,
            'created_at', u.created_at
          ) as user
        FROM artists ar
        JOIN users u ON ar.user_id = u.id
        WHERE ar.display_name ILIKE $1
        ORDER BY 
          CASE 
            WHEN LOWER(ar.display_name) = LOWER($2) THEN 1
            WHEN LOWER(ar.display_name) LIKE LOWER($2) || '%' THEN 2
            ELSE 3
          END,
          ar.streams DESC NULLS LAST,
          ar.display_name`,
        [`%${q}%`, q]
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
