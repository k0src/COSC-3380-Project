import type {
  Song,
  Album,
  Artist,
  LibraryPlaylist,
  Playlist,
  RecentlyPlayedItems,
  RecentlyPlayedItemsArray,
  LibrarySearchResults,
  UUID,
  LibrarySong,
  LibraryAlbum,
  LibraryArtist,
} from "@types";
import { query, withTransaction } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

/**
 * Service for managing user libraries and history.
 */
export default class LibraryService {
  /**
   * Searches the user's library for songs, albums, playlists, and artists matching the query.
   * @param userId The ID of the user.
   * @param q The search query string.
   * @returns An object containing arrays of matching songs, albums, playlists, and artists.
   */
  static async search(userId: UUID, q: string): Promise<LibrarySearchResults> {
    try {
      const songsSql = `
        SELECT s.*,
          (SELECT json_agg(row_to_json(album_with_artist))
          FROM (
            SELECT a.*,
              row_to_json(ar) AS artist
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar ON ar.id = a.created_by
            WHERE als.song_id = s.id
          ) AS album_with_artist) AS albums,
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
          ) AS ar_with_role) AS artists
        FROM songs s
        JOIN song_likes sl ON sl.song_id = s.id
        WHERE sl.user_id = $1 AND s.title ILIKE $2
        ORDER BY sl.liked_at DESC
        LIMIT 50
      `;

      const albumsSql = `
        SELECT a.*,
          (SELECT row_to_json(artist_with_user)
          FROM (
            SELECT ar.*,
              row_to_json(u) AS user
            FROM artists ar
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE ar.id = a.created_by
          ) AS artist_with_user) as artist,
          (SELECT COUNT(*) FROM album_songs als 
          WHERE als.album_id = a.id) as song_count
        FROM albums a
        JOIN album_likes al ON al.album_id = a.id
        WHERE al.user_id = $1 AND a.title ILIKE $2
        ORDER BY al.liked_at DESC
        LIMIT 50
      `;

      const playlistsSql = `
        SELECT p.*,
          row_to_json(u.*) as user,
          (SELECT COUNT(*) FROM playlist_songs ps
          WHERE ps.playlist_id = p.id) as song_count
        FROM playlists p
        LEFT JOIN users u ON p.created_by = u.id
        JOIN playlist_likes pl ON pl.playlist_id = p.id
        WHERE pl.user_id = $1 AND p.title ILIKE $2
        ORDER BY pl.liked_at DESC
        LIMIT 50
      `;

      const artistsSql = `
        SELECT a.*,
          row_to_json(u.*) as user
        FROM artists a
        LEFT JOIN users u ON a.user_id = u.id
        JOIN user_followers uf ON uf.following_id = a.user_id
        WHERE uf.follower_id = $1 AND a.display_name ILIKE $2
        ORDER BY uf.followed_at DESC
        LIMIT 50
      `;

      const searchPattern = `%${q}%`;

      const [songsResult, albumsResult, playlistsResult, artistsResult] =
        await Promise.all([
          query(songsSql, [userId, searchPattern]),
          query(albumsSql, [userId, searchPattern]),
          query(playlistsSql, [userId, searchPattern]),
          query(artistsSql, [userId, searchPattern]),
        ]);

      const songs: Song[] = (songsResult || []).map((song: Song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }
        if (song.albums && song.albums.length > 0) {
          song.albums = song.albums.map((album: Album) => {
            if (album.image_url) {
              album.image_url = getBlobUrl(album.image_url);
            }
            if (album.artist) {
              album.artist.type = "artist";
            }
            album.type = "album";
            return album;
          });
        }
        if (song.artists && song.artists.length > 0) {
          song.artists = song.artists.map((artist) => {
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
      });

      const albums: Album[] = (albumsResult || []).map((album: Album) => {
        if (album.image_url) {
          album.image_url = getBlobUrl(album.image_url);
        }
        if (album.artist) {
          if (album.artist.user && album.artist.user.profile_picture_url) {
            album.artist.user.profile_picture_url = getBlobUrl(
              album.artist.user.profile_picture_url
            );
          }
          album.artist.type = "artist";
        }
        album.type = "album";
        return album;
      });

      const playlists: Playlist[] = (playlistsResult || []).map(
        (playlist: Playlist) => {
          if (playlist.user && playlist.user.profile_picture_url) {
            playlist.user.profile_picture_url = getBlobUrl(
              playlist.user.profile_picture_url
            );
          }
          if (!playlist.image_url) {
            if (!playlist.image_url) {
              playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
            }
          }
          playlist.type = "playlist";
          return playlist;
        }
      );

      const artists: Artist[] = (artistsResult || []).map((artist: Artist) => {
        if (artist.user && artist.user.profile_picture_url) {
          artist.user.profile_picture_url = getBlobUrl(
            artist.user.profile_picture_url
          );
        }
        artist.type = "artist";
        return artist;
      });

      return {
        songs,
        albums,
        playlists,
        artists,
      };
    } catch (error) {
      console.error("Library search failed:", error);
      throw error;
    }
  }

  /**
   * Retrieves the recently played items for a user.
   * @param userId The ID of the user.
   * @param maxItems The maximum number of items to retrieve.
   * @returns A RecentlyPlayedItems object containing recently played songs, albums, playlists, and artists.
   * @throws An error if the operation fails.
   */
  static async getRecentlyPlayed(
    userId: UUID,
    maxItems: number = 10
  ): Promise<RecentlyPlayedItems> {
    try {
      const songsSql = `
        SELECT DISTINCT ON (s.id) s.*,
          (SELECT json_agg(row_to_json(album_with_artist))
          FROM (
            SELECT a.*,
              row_to_json(ar) AS artist
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar ON ar.id = a.created_by
            WHERE als.song_id = s.id
          ) AS album_with_artist) AS albums,
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
          ) AS ar_with_role) AS artists,
          MAX(sh.played_at) as played_at
        FROM songs s
        JOIN song_history sh ON sh.song_id = s.id
        WHERE sh.user_id = $1
        GROUP BY s.id
        ORDER BY s.id, played_at DESC
        LIMIT $2
      `;

      const albumsSql = `
        SELECT DISTINCT ON (a.id) a.*,
          (SELECT row_to_json(artist_with_user)
          FROM (
            SELECT ar.*,
              row_to_json(u) AS user
            FROM artists ar
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE ar.id = a.created_by
          ) AS artist_with_user) as artist,
          (SELECT COUNT(*) FROM album_songs als 
          WHERE als.album_id = a.id) as song_count,
          MAX(ah.played_at) as played_at
        FROM albums a
        JOIN album_history ah ON ah.album_id = a.id
        WHERE ah.user_id = $1
        GROUP BY a.id
        ORDER BY a.id, played_at DESC
        LIMIT $2
      `;

      const playlistsSql = `
        SELECT DISTINCT ON (p.id) p.*,
          row_to_json(u.*) as user,
          (SELECT COUNT(*) FROM playlist_songs ps
          WHERE ps.playlist_id = p.id) as song_count,
          EXISTS(
            SELECT 1 FROM user_playlist_pins upp
            WHERE upp.user_id = $1 AND upp.playlist_id = p.id
          ) as is_pinned,
          MAX(ph.played_at) as played_at,
          (SELECT EXISTS (
            SELECT 1 FROM playlist_songs ps WHERE ps.playlist_id = p.id
          )) AS has_song
        FROM playlists p
        LEFT JOIN users u ON p.created_by = u.id
        JOIN playlist_history ph ON ph.playlist_id = p.id
        WHERE ph.user_id = $1
        GROUP BY p.id, u.id
        ORDER BY p.id, is_pinned DESC, played_at DESC, p.id
        LIMIT $2
      `;

      const artistsSql = `
        SELECT DISTINCT ON (a.id) a.*,
          row_to_json(u.*) as user,
          MAX(arh.played_at) as played_at
        FROM artists a
        LEFT JOIN users u ON a.user_id = u.id
        JOIN artist_history arh ON arh.artist_id = a.id
        WHERE arh.user_id = $1
        GROUP BY a.id, u.id
        ORDER BY a.id, played_at DESC
        LIMIT $2
      `;

      const [songsResult, albumsResult, playlistsResult, artistsResult] =
        await Promise.all([
          query(songsSql, [userId, maxItems]),
          query(albumsSql, [userId, maxItems]),
          query(playlistsSql, [userId, maxItems]),
          query(artistsSql, [userId, maxItems]),
        ]);

      const songs: Song[] = (songsResult || []).map((song: Song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }
        if (song.albums && song.albums.length > 0) {
          song.albums = song.albums.map((album: Album) => {
            if (album.image_url) {
              album.image_url = getBlobUrl(album.image_url);
            }
            if (album.artist) {
              album.artist.type = "artist";
            }
            album.type = "album";
            return album;
          });
        }
        if (song.artists && song.artists.length > 0) {
          song.artists = song.artists.map((artist) => {
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
      });

      const albums: Album[] = (albumsResult || []).map((album: Album) => {
        if (album.image_url) {
          album.image_url = getBlobUrl(album.image_url);
        }
        if (album.artist) {
          if (album.artist.user && album.artist.user.profile_picture_url) {
            album.artist.user.profile_picture_url = getBlobUrl(
              album.artist.user.profile_picture_url
            );
          }
          album.artist.type = "artist";
        }
        album.type = "album";
        return album;
      });

      const playlists: LibraryPlaylist[] = (playlistsResult || []).map(
        (playlist: LibraryPlaylist) => {
          if (playlist.user && playlist.user.profile_picture_url) {
            playlist.user.profile_picture_url = getBlobUrl(
              playlist.user.profile_picture_url
            );
          }
          if (playlist.image_url) {
            playlist.image_url = getBlobUrl(playlist.image_url);
          } else if ((playlist as any).has_song) {
            playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
          }
          delete (playlist as any).has_song;
          playlist.is_pinned = playlist.is_pinned || false;
          playlist.type = "playlist";
          return playlist;
        }
      );

      const artists: Artist[] = (artistsResult || []).map((artist: Artist) => {
        if (artist.user && artist.user.profile_picture_url) {
          artist.user.profile_picture_url = getBlobUrl(
            artist.user.profile_picture_url
          );
        }
        artist.type = "artist";
        return artist;
      });

      return {
        songs,
        albums,
        playlists,
        artists,
      };
    } catch (error) {
      console.error("Get recently played items failed:", error);
      throw error;
    }
  }

  static async getRecentlyPlayedArray(
    userId: UUID,
    maxItems: number = 10
  ): Promise<RecentlyPlayedItemsArray> {
    try {
      const songsSql = `
      SELECT DISTINCT ON (s.id) s.*,
        (SELECT json_agg(row_to_json(album_with_artist))
        FROM (
          SELECT a.*,
            row_to_json(ar) AS artist
          FROM albums a
          JOIN album_songs als ON als.album_id = a.id
          LEFT JOIN artists ar ON ar.id = a.created_by
          WHERE als.song_id = s.id
        ) AS album_with_artist) AS albums,
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
        ) AS ar_with_role) AS artists,
        MAX(sh.played_at) as played_at
      FROM songs s
      JOIN song_history sh ON sh.song_id = s.id
      WHERE sh.user_id = $1
      GROUP BY s.id
      ORDER BY s.id, played_at DESC
    `;

      const albumsSql = `
      SELECT DISTINCT ON (a.id) a.*,
        (SELECT row_to_json(artist_with_user)
        FROM (
          SELECT ar.*,
            row_to_json(u) AS user
          FROM artists ar
          LEFT JOIN users u ON ar.user_id = u.id
          WHERE ar.id = a.created_by
        ) AS artist_with_user) as artist,
        (SELECT COUNT(*) FROM album_songs als 
        WHERE als.album_id = a.id) as song_count,
        MAX(ah.played_at) as played_at
      FROM albums a
      JOIN album_history ah ON ah.album_id = a.id
      WHERE ah.user_id = $1
      GROUP BY a.id
      ORDER BY a.id, played_at DESC
    `;

      const playlistsSql = `
      SELECT DISTINCT ON (p.id) p.*,
        row_to_json(u.*) as user,
        (SELECT COUNT(*) FROM playlist_songs ps
        WHERE ps.playlist_id = p.id) as song_count,
        EXISTS(
          SELECT 1 FROM user_playlist_pins upp
          WHERE upp.user_id = $1 AND upp.playlist_id = p.id
        ) as is_pinned,
        MAX(ph.played_at) as played_at,
        (SELECT EXISTS (
          SELECT 1 FROM playlist_songs ps WHERE ps.playlist_id = p.id
        )) AS has_song
      FROM playlists p
      LEFT JOIN users u ON p.created_by = u.id
      JOIN playlist_history ph ON ph.playlist_id = p.id
      WHERE ph.user_id = $1
      GROUP BY p.id, u.id
      ORDER BY p.id, is_pinned DESC, played_at DESC, p.id
    `;

      const artistsSql = `
      SELECT DISTINCT ON (a.id) a.*,
        row_to_json(u.*) as user,
        MAX(arh.played_at) as played_at
      FROM artists a
      LEFT JOIN users u ON a.user_id = u.id
      JOIN artist_history arh ON arh.artist_id = a.id
      WHERE arh.user_id = $1
      GROUP BY a.id, u.id
      ORDER BY a.id, played_at DESC
    `;

      const [songsResult, albumsResult, playlistsResult, artistsResult] =
        await Promise.all([
          query(songsSql, [userId]),
          query(albumsSql, [userId]),
          query(playlistsSql, [userId]),
          query(artistsSql, [userId]),
        ]);

      const songs: LibrarySong[] = (songsResult || []).map(
        (song: LibrarySong) => {
          if (song.image_url) {
            song.image_url = getBlobUrl(song.image_url);
          }
          if (song.audio_url) {
            song.audio_url = getBlobUrl(song.audio_url);
          }
          if (song.albums && song.albums.length > 0) {
            song.albums = song.albums.map((album: Album) => {
              if (album.image_url) {
                album.image_url = getBlobUrl(album.image_url);
              }
              if (album.artist) {
                album.artist.type = "artist";
              }
              album.type = "album";
              return album;
            });
          }
          if (song.artists && song.artists.length > 0) {
            song.artists = song.artists.map((artist) => {
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
        }
      );

      const albums: LibraryAlbum[] = (albumsResult || []).map(
        (album: LibraryAlbum) => {
          if (album.image_url) {
            album.image_url = getBlobUrl(album.image_url);
          }
          if (album.artist) {
            if (album.artist.user && album.artist.user.profile_picture_url) {
              album.artist.user.profile_picture_url = getBlobUrl(
                album.artist.user.profile_picture_url
              );
            }
            album.artist.type = "artist";
          }
          album.type = "album";
          return album;
        }
      );

      const playlists: LibraryPlaylist[] = (playlistsResult || []).map(
        (playlist: LibraryPlaylist) => {
          if (playlist.user && playlist.user.profile_picture_url) {
            playlist.user.profile_picture_url = getBlobUrl(
              playlist.user.profile_picture_url
            );
          }
          if (playlist.image_url) {
            playlist.image_url = getBlobUrl(playlist.image_url);
          } else if ((playlist as any).has_song) {
            playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
          }
          delete (playlist as any).has_song;
          playlist.is_pinned = playlist.is_pinned || false;
          playlist.type = "playlist";
          return playlist;
        }
      );

      const artists: LibraryArtist[] = (artistsResult || []).map(
        (artist: LibraryArtist) => {
          if (artist.user && artist.user.profile_picture_url) {
            artist.user.profile_picture_url = getBlobUrl(
              artist.user.profile_picture_url
            );
          }
          artist.type = "artist";
          return artist;
        }
      );

      const allItems = [...songs, ...albums, ...playlists, ...artists];
      allItems.sort((a, b) => {
        const dateA = new Date(a.played_at || 0).getTime();
        const dateB = new Date(b.played_at || 0).getTime();
        return dateB - dateA;
      });

      return allItems.slice(0, maxItems);
    } catch (error) {
      console.error("Get recently played array failed:", error);
      throw error;
    }
  }

  /**
   * Retrieves liked songs for a user.
   * @param userId The ID of the user.
   * @param options.limit The maximum number of songs to retrieve.
   * @param options.offset The number of songs to skip.
   * @returns An array of liked songs.
   * @throws An error if the operation fails.
   */
  static async getLibrarySongs(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Song[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const sql = `
        SELECT s.*,
          (SELECT json_agg(row_to_json(album_with_artist))
          FROM (
            SELECT a.*,
              row_to_json(ar) AS artist
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar ON ar.id = a.created_by
            WHERE als.song_id = s.id
          ) AS album_with_artist) AS albums,
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
          ) AS ar_with_role) AS artists
        FROM songs s
        JOIN song_likes sl ON sl.song_id = s.id
        WHERE sl.user_id = $1
        ORDER BY sl.liked_at DESC
        LIMIT $2 OFFSET $3
      `;

      const songsResult = await query(sql, [userId, limit, offset]);

      const songs: Song[] = (songsResult || []).map((song: Song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }
        if (song.albums && song.albums.length > 0) {
          song.albums = song.albums.map((album: Album) => {
            if (album.image_url) {
              album.image_url = getBlobUrl(album.image_url);
            }
            if (album.artist) {
              album.artist.type = "artist";
            }
            album.type = "album";
            return album;
          });
        }
        if (song.artists && song.artists.length > 0) {
          song.artists = song.artists.map((artist) => {
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
      });

      return songs;
    } catch (error) {
      console.error("Get library songs failed:", error);
      throw error;
    }
  }

  /**
   * Retrieves liked playlists and user-created playlists for a user.
   * @param userId The ID of the user.
   * @param options.omitLikes Option to only include user-created playlists.
   * @param options.limit The maximum number of playlists to retrieve.
   * @param options.offset The number of playlists to skip.
   * @returns An array of playlists (liked and/or created by user).
   * @throws An error if the operation fails.
   */
  static async getLibraryPlaylists(
    userId: UUID,
    options?: { omitLikes?: boolean; limit?: number; offset?: number }
  ): Promise<Playlist[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const omitLikes = options?.omitLikes ?? false;

      const sql = `
        SELECT p.*,
          row_to_json(u.*) as user,
          (SELECT COUNT(*) FROM playlist_songs ps
          WHERE ps.playlist_id = p.id) as song_count,
          EXISTS(
            SELECT 1 FROM user_playlist_pins upp
            WHERE upp.user_id = $1 AND upp.playlist_id = p.id
          ) as is_pinned,
          COALESCE(pl.liked_at, p.created_at) as sort_date,
          (SELECT EXISTS (
            SELECT 1 FROM playlist_songs ps WHERE ps.playlist_id = p.id
          )) AS has_song
        FROM playlists p
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN playlist_likes pl ON pl.playlist_id = p.id AND pl.user_id = $1
        WHERE ${
          omitLikes
            ? "p.created_by = $1"
            : "(pl.user_id = $1 OR p.created_by = $1)"
        }
        ORDER BY is_pinned DESC, sort_date DESC, p.id
        LIMIT $2 OFFSET $3
      `;

      const playlistsResult = await query(sql, [userId, limit, offset]);

      const playlists: LibraryPlaylist[] = (playlistsResult || []).map(
        (playlist: LibraryPlaylist) => {
          if (playlist.user && playlist.user.profile_picture_url) {
            playlist.user.profile_picture_url = getBlobUrl(
              playlist.user.profile_picture_url
            );
          }
          if (playlist.image_url) {
            playlist.image_url = getBlobUrl(playlist.image_url);
          } else if ((playlist as any).has_song) {
            playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
          }
          delete (playlist as any).has_song;

          playlist.is_pinned = playlist.is_pinned || false;
          playlist.type = "playlist";
          return playlist;
        }
      );

      return playlists;
    } catch (error) {
      console.error("Get library playlists failed:", error);
      throw error;
    }
  }

  /**
   * Retrieves liked albums for a user.
   * @param userId The ID of the user.
   * @param options.limit The maximum number of albums to retrieve.
   * @param options.offset The number of albums to skip.
   * @returns An array of liked albums.
   * @throws An error if the operation fails.
   */
  static async getLibraryAlbums(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Album[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const sql = `
        SELECT a.*,
          (SELECT row_to_json(artist_with_user)
          FROM (
            SELECT ar.*,
              row_to_json(u) AS user
            FROM artists ar
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE ar.id = a.created_by
          ) AS artist_with_user) as artist,
          (SELECT COUNT(*) FROM album_songs als 
          WHERE als.album_id = a.id) as song_count
        FROM albums a
        JOIN album_likes al ON al.album_id = a.id
        WHERE al.user_id = $1
        ORDER BY al.liked_at DESC
        LIMIT $2 OFFSET $3
      `;

      const albumsResult = await query(sql, [userId, limit, offset]);

      const albums: Album[] = (albumsResult || []).map((album: Album) => {
        if (album.image_url) {
          album.image_url = getBlobUrl(album.image_url);
        }
        if (album.artist) {
          if (album.artist.user && album.artist.user.profile_picture_url) {
            album.artist.user.profile_picture_url = getBlobUrl(
              album.artist.user.profile_picture_url
            );
          }
          album.artist.type = "artist";
        }
        album.type = "album";
        return album;
      });

      return albums;
    } catch (error) {
      console.error("Get library albums failed:", error);
      throw error;
    }
  }

  /**
   * Retrieves followed artists for a user.
   * @param userId The ID of the user.
   * @param options Pagination options.
   * @returns An array of followed artists.
   * @throws An error if the operation fails.
   */
  static async getLibraryArtists(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<Artist[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const sql = `
        SELECT a.*,
          row_to_json(u.*) as user
        FROM artists a
        LEFT JOIN users u ON a.user_id = u.id
        JOIN user_followers uf ON uf.following_id = a.user_id
        WHERE uf.follower_id = $1
        ORDER BY uf.followed_at DESC
        LIMIT $2 OFFSET $3
      `;

      const artistsResult = await query(sql, [userId, limit, offset]);

      const artists: Artist[] = (artistsResult || []).map((artist: Artist) => {
        if (artist.user && artist.user.profile_picture_url) {
          artist.user.profile_picture_url = getBlobUrl(
            artist.user.profile_picture_url
          );
        }
        artist.type = "artist";
        return artist;
      });

      return artists;
    } catch (error) {
      console.error("Get library artists failed:", error);
      throw error;
    }
  }

  /**
   * Retrieves song history for a user within a time range.
   * @param userId The ID of the user.
   * @param options.timeRange The time range for history (e.g., '1 month', '6 months', '1 year').
   * @param options.limit The maximum number of songs to retrieve.
   * @param options.offset The number of songs to skip.
   * @returns An array of songs from history.
   * @throws An error if the operation fails.
   */
  static async getSongHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ): Promise<Song[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const timeRange = options?.timeRange ?? "1 year";

      const sql = `
        SELECT DISTINCT ON (s.id) s.*,
          (SELECT json_agg(row_to_json(album_with_artist))
          FROM (
            SELECT a.*,
              row_to_json(ar) AS artist
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar ON ar.id = a.created_by
            WHERE als.song_id = s.id
          ) AS album_with_artist) AS albums,
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
          ) AS ar_with_role) AS artists,
          MAX(sh.played_at) as played_at
        FROM songs s
        JOIN song_history sh ON sh.song_id = s.id
        WHERE sh.user_id = $1 AND sh.played_at >= NOW() - INTERVAL '${timeRange}'
        GROUP BY s.id
        ORDER BY s.id, played_at DESC
        LIMIT $2 OFFSET $3
      `;

      const songsResult = await query(sql, [userId, limit, offset]);

      const songs: Song[] = (songsResult || []).map((song: Song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }
        if (song.albums && song.albums.length > 0) {
          song.albums = song.albums.map((album: Album) => {
            if (album.image_url) {
              album.image_url = getBlobUrl(album.image_url);
            }
            if (album.artist) {
              album.artist.type = "artist";
            }
            album.type = "album";
            return album;
          });
        }
        if (song.artists && song.artists.length > 0) {
          song.artists = song.artists.map((artist) => {
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
      });

      return songs;
    } catch (error) {
      console.error("Get song history failed:", error);
      throw error;
    }
  }

  /**
   * Retrieves album history for a user within a time range.
   * @param userId The ID of the user.
   * @param options.timeRange The time range for history (e.g., '1 month', '6 months', '1 year').
   * @param options.limit The maximum number of albums to retrieve.
   * @param options.offset The number of albums to skip.
   * @returns An array of albums from history.
   * @throws An error if the operation fails.
   */
  static async getAlbumHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ): Promise<Album[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const timeRange = options?.timeRange ?? "1 year";

      const sql = `
        SELECT DISTINCT ON (a.id) a.*,
          (SELECT row_to_json(artist_with_user)
          FROM (
            SELECT ar.*,
              row_to_json(u) AS user
            FROM artists ar
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE ar.id = a.created_by
          ) AS artist_with_user) as artist,
          (SELECT COUNT(*) FROM album_songs als 
          WHERE als.album_id = a.id) as song_count,
          MAX(ah.played_at) as played_at
        FROM albums a
        JOIN album_history ah ON ah.album_id = a.id
        WHERE ah.user_id = $1 AND ah.played_at >= NOW() - INTERVAL '${timeRange}'
        GROUP BY a.id
        ORDER BY a.id, played_at DESC
        LIMIT $2 OFFSET $3
      `;

      const albumsResult = await query(sql, [userId, limit, offset]);

      const albums: Album[] = (albumsResult || []).map((album: Album) => {
        if (album.image_url) {
          album.image_url = getBlobUrl(album.image_url);
        }
        if (album.artist) {
          if (album.artist.user && album.artist.user.profile_picture_url) {
            album.artist.user.profile_picture_url = getBlobUrl(
              album.artist.user.profile_picture_url
            );
          }
          album.artist.type = "artist";
        }
        album.type = "album";
        return album;
      });

      return albums;
    } catch (error) {
      console.error("Get album history failed:", error);
      throw error;
    }
  }

  /**
   * Retrieves playlist history for a user within a time range.
   * @param userId The ID of the user.
   * @param options.timeRange The time range for history (e.g., '1 month', '6 months', '1 year').
   * @param options.limit The maximum number of playlists to retrieve.
   * @param options.offset The number of playlists to skip.
   * @returns An array of playlists from history.
   * @throws An error if the operation fails.
   */
  static async getPlaylistHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ): Promise<Playlist[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const timeRange = options?.timeRange ?? "1 year";

      const sql = `
        SELECT DISTINCT ON (p.id) p.*,
          row_to_json(u.*) as user,
          (SELECT COUNT(*) FROM playlist_songs ps
          WHERE ps.playlist_id = p.id) as song_count,
          MAX(ph.played_at) as played_at,
          (SELECT EXISTS (
            SELECT 1 FROM playlist_songs ps WHERE ps.playlist_id = p.id
          )) AS has_song
        FROM playlists p
        LEFT JOIN users u ON p.created_by = u.id
        JOIN playlist_history ph ON ph.playlist_id = p.id
        WHERE ph.user_id = $1 AND ph.played_at >= NOW() - INTERVAL '${timeRange}'
        GROUP BY p.id, u.id
        ORDER BY p.id, played_at DESC
        LIMIT $2 OFFSET $3
      `;

      const playlistsResult = await query(sql, [userId, limit, offset]);

      const playlists: Playlist[] = (playlistsResult || []).map(
        (playlist: Playlist) => {
          if (playlist.user && playlist.user.profile_picture_url) {
            playlist.user.profile_picture_url = getBlobUrl(
              playlist.user.profile_picture_url
            );
          }
          if (playlist.image_url) {
            playlist.image_url = getBlobUrl(playlist.image_url);
          } else if ((playlist as any).has_song) {
            playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
          }
          delete (playlist as any).has_song;
          playlist.type = "playlist";
          return playlist;
        }
      );

      return playlists;
    } catch (error) {
      console.error("Get playlist history failed:", error);
      throw error;
    }
  }

  /**
   * Retrieves artist history for a user within a time range.
   * @param userId The ID of the user.
   * @param options.timeRange The time range for history (e.g., '1 month', '6 months', '1 year').
   * @param options.limit The maximum number of artists to retrieve.
   * @param options.offset The number of artists to skip.
   * @returns An array of artists from history.
   * @throws An error if the operation fails.
   */
  static async getArtistHistory(
    userId: UUID,
    options?: { timeRange?: string; limit?: number; offset?: number }
  ): Promise<Artist[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const timeRange = options?.timeRange ?? "1 year";

      const sql = `
        SELECT DISTINCT ON (a.id) a.*,
          row_to_json(u.*) as user,
          MAX(arh.played_at) as played_at
        FROM artists a
        LEFT JOIN users u ON a.user_id = u.id
        JOIN artist_history arh ON arh.artist_id = a.id
        WHERE arh.user_id = $1 AND arh.played_at >= NOW() - INTERVAL '${timeRange}'
        GROUP BY a.id, u.id
        ORDER BY a.id, played_at DESC
        LIMIT $2 OFFSET $3
      `;

      const artistsResult = await query(sql, [userId, limit, offset]);

      const artists: Artist[] = (artistsResult || []).map((artist: Artist) => {
        if (artist.user && artist.user.profile_picture_url) {
          artist.user.profile_picture_url = getBlobUrl(
            artist.user.profile_picture_url
          );
        }
        artist.type = "artist";
        return artist;
      });

      return artists;
    } catch (error) {
      console.error("Get artist history failed:", error);
      throw error;
    }
  }

  /**
   * Toggles the pinned status of a playlist for a user.
   * @param userId The ID of the user.
   * @param playlistId The ID of the playlist.
   * @returns A boolean indicating the new pinned status (true if pinned, false if unpinned).
   * @throws An error if the operation fails.
   */
  static async togglePinPlaylist(
    userId: UUID,
    playlistId: UUID
  ): Promise<boolean> {
    try {
      const result = await withTransaction(async (client) => {
        const res = await client.query("SELECT toggle_playlist_pin($1, $2)", [
          userId,
          playlistId,
        ]);
        return res.rows[0].toggle_playlist_pin;
      });
      return result;
    } catch (error) {
      console.error("Toggle pin playlist failed:", error);
      throw error;
    }
  }
}
