import type {
  Song,
  Album,
  Artist,
  LibraryPlaylist,
  Playlist,
  RecentlyPlayedItems,
  LibrarySearchResults,
  UUID,
} from "@types";
import { query, withTransaction } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { isDeleted, notDeletedCondition } from "@util";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export default class LibraryService {
  static async search(
    userId: UUID,
    q: string,
    options?: { limit?: number; offset?: number }
  ): Promise<LibrarySearchResults> {
    try {
      const { limit = 50, offset = 0 } = options || {};
      const searchPattern = `%${q}%`;

      const songsSql = `
        SELECT DISTINCT ON (s.id)
          s.*,
          sl.liked_at,
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'title', a.title,
                'image_url', a.image_url,
                'image_url_blurhash', a.image_url_blurhash,
                'owner_id', a.owner_id,
                'visibility_status', a.visibility_status,
                'release_date', a.release_date,
                'genre', a.genre,
                'created_at', a.created_at,
                'updated_at', a.updated_at,
                'type', 'album',
                'artist', json_build_object(
                  'id', ar_album.id,
                  'display_name', ar_album.display_name,
                  'bio', ar_album.bio,
                  'user_id', ar_album.user_id,
                  'verified', ar_album.verified,
                  'location', ar_album.location,
                  'banner_image_url', ar_album.banner_image_url,
                  'banner_image_url_blurhash', ar_album.banner_image_url_blurhash,
                  'created_at', ar_album.created_at,
                  'updated_at', ar_album.updated_at,
                  'type', 'artist'
                )
              )
            )
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar_album ON ar_album.id = a.created_by
            WHERE als.song_id = s.id
              AND ${notDeletedCondition("album", "a")}
              AND (a.visibility_status = 'PUBLIC' OR a.owner_id = '${userId}')
              AND (ar_album.id IS NULL OR ${notDeletedCondition(
                "artist",
                "ar_album"
              )})
          ) AS albums,
          (
            SELECT json_agg(
              json_build_object(
                'id', ar.id,
                'display_name', ar.display_name,
                'bio', ar.bio,
                'user_id', ar.user_id,
                'verified', ar.verified,
                'location', ar.location,
                'banner_image_url', ar.banner_image_url,
                'banner_image_url_blurhash', ar.banner_image_url_blurhash,
                'created_at', ar.created_at,
                'updated_at', ar.updated_at,
                'role', sa.role,
                'type', 'artist',
                'user', json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'email', u.email,
                  'profile_picture_url', u.profile_picture_url,
                  'pfp_blurhash', u.pfp_blurhash,
                  'role', u.role,
                  'is_private', u.is_private,
                  'status', u.status,
                  'artist_id', u.artist_id,
                  'created_at', u.created_at,
                  'updated_at', u.updated_at
                )
              )
            )
            FROM song_artists sa
            JOIN artists ar ON ar.id = sa.artist_id
            JOIN users u ON u.id = ar.user_id
            WHERE sa.song_id = s.id
              AND ${notDeletedCondition("artist", "ar")}
              AND ${notDeletedCondition("user", "u")}
              AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
          ) AS artists,
          (
            SELECT COUNT(*)
            FROM song_likes sl2
            WHERE sl2.song_id = s.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM comments c
            WHERE c.song_id = s.id
              AND ${notDeletedCondition("comment", "c")}
          ) AS comments,
          EXISTS (
            SELECT 1
            FROM trending_songs ts
            WHERE ts.song_id = s.id
          ) AS is_trending
        FROM songs s
        JOIN song_likes sl ON sl.song_id = s.id
        WHERE sl.user_id = $1
          AND s.title ILIKE $2
          AND ${notDeletedCondition("song", "s")}
          AND (s.visibility_status = 'PUBLIC' OR s.owner_id = '${userId}')
        ORDER BY s.id, sl.liked_at DESC
        LIMIT $3 OFFSET $4
      `;

      const albumsSql = `
        SELECT DISTINCT ON (a.id)
          a.*,
          al.liked_at,
          (
            SELECT row_to_json(artist_with_user)
            FROM (
              SELECT
                ar.id,
                ar.display_name,
                ar.bio,
                ar.user_id,
                ar.verified,
                ar.location,
                ar.banner_image_url,
                ar.banner_image_url_blurhash,
                ar.created_at,
                ar.updated_at,
                'artist' AS type,
                row_to_json(u.*) AS user
              FROM artists ar
              LEFT JOIN users u ON u.id = ar.user_id
              WHERE ar.id = a.created_by
                AND ${notDeletedCondition("artist", "ar")}
                AND (u.id IS NULL OR (${notDeletedCondition(
                  "user",
                  "u"
                )} AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))))
            ) AS artist_with_user
          ) AS artist,
          (
            SELECT COUNT(*)
            FROM album_likes al2
            WHERE al2.album_id = a.id
          ) AS likes,
          (
            SELECT SUM(s.duration)
            FROM songs s
            JOIN album_songs als ON als.song_id = s.id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT COUNT(*)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT json_agg(als.song_id)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids
        FROM albums a
        JOIN album_likes al ON al.album_id = a.id
        WHERE al.user_id = $1
          AND a.title ILIKE $2
          AND ${notDeletedCondition("album", "a")}
          AND (a.visibility_status = 'PUBLIC' OR a.owner_id = '${userId}')
        ORDER BY a.id, al.liked_at DESC
        LIMIT $3 OFFSET $4
      `;

      const playlistsSql = `
        SELECT DISTINCT ON (p.id)
          p.*,
          COALESCE(pl.liked_at, p.created_at) AS liked_at,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = p.owner_id
                AND ${notDeletedCondition("user", "u")}
                AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
            ) AS user_data
          ) AS user,
          (
            SELECT COUNT(*)
            FROM playlist_likes pl2
            WHERE pl2.playlist_id = p.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT COALESCE(SUM(s.duration), 0)
            FROM songs s
            JOIN playlist_songs ps ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT json_agg(ps.song_id ORDER BY ps.position)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids,
          (
            SELECT EXISTS (
              SELECT 1
              FROM playlist_songs ps
              JOIN songs s ON s.id = ps.song_id
              WHERE ps.playlist_id = p.id
                AND ${notDeletedCondition("song", "s")}
            )
          ) AS has_song
        FROM playlists p
        LEFT JOIN playlist_likes pl ON pl.playlist_id = p.id AND pl.user_id = $1
        WHERE (pl.user_id = $1 OR p.owner_id = $1)
          AND p.title ILIKE $2
          AND ${notDeletedCondition("playlist", "p")}
          AND (p.visibility_status = 'PUBLIC' OR p.owner_id = '${userId}')
        ORDER BY p.id, COALESCE(pl.liked_at, p.created_at) DESC
        LIMIT $3 OFFSET $4
      `;

      const artistsSql = `
        SELECT DISTINCT ON (ar.id)
          ar.*,
          uf.followed_at,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = ar.user_id
                AND ${notDeletedCondition("user", "u")}
                AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
            ) AS user_data
          ) AS user
        FROM artists ar
        JOIN users u_artist ON u_artist.id = ar.user_id
        JOIN user_followers uf ON uf.following_id = u_artist.id
        WHERE uf.follower_id = $1
          AND ar.display_name ILIKE $2
          AND ${notDeletedCondition("artist", "ar")}
        ORDER BY ar.id, uf.followed_at DESC
        LIMIT $3 OFFSET $4
      `;

      const [songsResult, albumsResult, playlistsResult, artistsResult] =
        await Promise.all([
          query(songsSql, [userId, searchPattern, limit, offset]),
          query(albumsSql, [userId, searchPattern, limit, offset]),
          query(playlistsSql, [userId, searchPattern, limit, offset]),
          query(artistsSql, [userId, searchPattern, limit, offset]),
        ]);

      const songs: Song[] = (songsResult || []).map((song: Song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }

        if (song.albums?.length) {
          song.albums.forEach((album) => {
            if (album.image_url) {
              album.image_url = getBlobUrl(album.image_url);
            }
            if (album.artist?.banner_image_url) {
              album.artist.banner_image_url = getBlobUrl(
                album.artist.banner_image_url
              );
            }
          });
        }

        if (song.artists?.length) {
          song.artists.forEach((artist) => {
            if (artist.banner_image_url) {
              artist.banner_image_url = getBlobUrl(artist.banner_image_url);
            }
            if (artist.user?.profile_picture_url) {
              artist.user.profile_picture_url = getBlobUrl(
                artist.user.profile_picture_url
              );
            }
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
          if (album.artist.banner_image_url) {
            album.artist.banner_image_url = getBlobUrl(
              album.artist.banner_image_url
            );
          }
          if (album.artist.user?.profile_picture_url) {
            album.artist.user.profile_picture_url = getBlobUrl(
              album.artist.user.profile_picture_url
            );
          }
        }

        album.type = "album";
        return album;
      });

      const playlists: Playlist[] = (playlistsResult || []).map(
        (playlist: Playlist) => {
          if (playlist.user?.profile_picture_url) {
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

      const artists: Artist[] = (artistsResult || []).map((artist: Artist) => {
        if (artist.banner_image_url) {
          artist.banner_image_url = getBlobUrl(artist.banner_image_url);
        }

        if (artist.user?.profile_picture_url) {
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

  static async getRecentlyPlayed(
    userId: UUID,
    options?: { limit?: number; offset?: number }
  ): Promise<RecentlyPlayedItems> {
    try {
      const { limit = 20, offset = 0 } = options || {};

      const songsSql = `
        SELECT DISTINCT ON (s.id)
          s.*,
          sh.played_at,
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'title', a.title,
                'image_url', a.image_url,
                'image_url_blurhash', a.image_url_blurhash,
                'owner_id', a.owner_id,
                'visibility_status', a.visibility_status,
                'release_date', a.release_date,
                'genre', a.genre,
                'created_at', a.created_at,
                'updated_at', a.updated_at,
                'type', 'album',
                'artist', json_build_object(
                  'id', ar_album.id,
                  'display_name', ar_album.display_name,
                  'bio', ar_album.bio,
                  'user_id', ar_album.user_id,
                  'verified', ar_album.verified,
                  'location', ar_album.location,
                  'banner_image_url', ar_album.banner_image_url,
                  'banner_image_url_blurhash', ar_album.banner_image_url_blurhash,
                  'created_at', ar_album.created_at,
                  'updated_at', ar_album.updated_at,
                  'type', 'artist'
                )
              )
            )
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar_album ON ar_album.id = a.created_by
            WHERE als.song_id = s.id
              AND ${notDeletedCondition("album", "a")}
              AND (a.visibility_status = 'PUBLIC' OR a.owner_id = '${userId}')
              AND (ar_album.id IS NULL OR ${notDeletedCondition(
                "artist",
                "ar_album"
              )})
          ) AS albums,
          (
            SELECT json_agg(
              json_build_object(
                'id', ar.id,
                'display_name', ar.display_name,
                'bio', ar.bio,
                'user_id', ar.user_id,
                'verified', ar.verified,
                'location', ar.location,
                'banner_image_url', ar.banner_image_url,
                'banner_image_url_blurhash', ar.banner_image_url_blurhash,
                'created_at', ar.created_at,
                'updated_at', ar.updated_at,
                'role', sa.role,
                'type', 'artist',
                'user', json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'email', u.email,
                  'profile_picture_url', u.profile_picture_url,
                  'pfp_blurhash', u.pfp_blurhash,
                  'role', u.role,
                  'is_private', u.is_private,
                  'status', u.status,
                  'artist_id', u.artist_id,
                  'created_at', u.created_at,
                  'updated_at', u.updated_at
                )
              )
            )
            FROM song_artists sa
            JOIN artists ar ON ar.id = sa.artist_id
            JOIN users u ON u.id = ar.user_id
            WHERE sa.song_id = s.id
              AND ${notDeletedCondition("artist", "ar")}
              AND ${notDeletedCondition("user", "u")}
              AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
          ) AS artists,
          (
            SELECT COUNT(*)
            FROM song_likes sl
            WHERE sl.song_id = s.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM comments c
            WHERE c.song_id = s.id
              AND ${notDeletedCondition("comment", "c")}
          ) AS comments,
          EXISTS (
            SELECT 1
            FROM trending_songs ts
            WHERE ts.song_id = s.id
          ) AS is_trending
        FROM songs s
        JOIN song_history sh ON sh.song_id = s.id
        WHERE sh.user_id = $1
          AND ${notDeletedCondition("song", "s")}
          AND (s.visibility_status = 'PUBLIC' OR s.owner_id = '${userId}')
        ORDER BY s.id, sh.played_at DESC
        LIMIT $2 OFFSET $3
      `;

      const albumsSql = `
        SELECT DISTINCT ON (a.id)
          a.*,
          ah.played_at,
          (
            SELECT row_to_json(artist_with_user)
            FROM (
              SELECT
                ar.id,
                ar.display_name,
                ar.bio,
                ar.user_id,
                ar.verified,
                ar.location,
                ar.banner_image_url,
                ar.banner_image_url_blurhash,
                ar.created_at,
                ar.updated_at,
                'artist' AS type,
                row_to_json(u.*) AS user
              FROM artists ar
              LEFT JOIN users u ON u.id = ar.user_id
              WHERE ar.id = a.created_by
                AND ${notDeletedCondition("artist", "ar")}
                AND (u.id IS NULL OR (${notDeletedCondition(
                  "user",
                  "u"
                )} AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))))
            ) AS artist_with_user
          ) AS artist,
          (
            SELECT COUNT(*)
            FROM album_likes al
            WHERE al.album_id = a.id
          ) AS likes,
          (
            SELECT SUM(s.duration)
            FROM songs s
            JOIN album_songs als ON als.song_id = s.id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT COUNT(*)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT json_agg(als.song_id)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids
        FROM albums a
        JOIN album_history ah ON ah.album_id = a.id
        WHERE ah.user_id = $1
          AND ${notDeletedCondition("album", "a")}
          AND (a.visibility_status = 'PUBLIC' OR a.owner_id = '${userId}')
        ORDER BY a.id, ah.played_at DESC
        LIMIT $2 OFFSET $3
      `;

      const playlistsSql = `
        SELECT DISTINCT ON (p.id)
          p.*,
          ph.played_at,
          EXISTS (
            SELECT 1 FROM user_playlist_pins upp
            WHERE upp.user_id = $1 AND upp.playlist_id = p.id
          ) AS is_pinned,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = p.owner_id
                AND ${notDeletedCondition("user", "u")}
                AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
            ) AS user_data
          ) AS user,
          (
            SELECT COUNT(*)
            FROM playlist_likes pl
            WHERE pl.playlist_id = p.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT COALESCE(SUM(s.duration), 0)
            FROM songs s
            JOIN playlist_songs ps ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT json_agg(ps.song_id ORDER BY ps.position)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids,
          (
            SELECT EXISTS (
              SELECT 1
              FROM playlist_songs ps
              JOIN songs s ON s.id = ps.song_id
              WHERE ps.playlist_id = p.id
                AND ${notDeletedCondition("song", "s")}
            )
          ) AS has_song
        FROM playlists p
        JOIN playlist_history ph ON ph.playlist_id = p.id
        WHERE ph.user_id = $1
          AND ${notDeletedCondition("playlist", "p")}
          AND (p.visibility_status = 'PUBLIC' OR p.owner_id = '${userId}')
        ORDER BY p.id, ph.played_at DESC
        LIMIT $2 OFFSET $3
      `;

      const artistsSql = `
        SELECT DISTINCT ON (ar.id)
          ar.*,
          arh.played_at,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = ar.user_id
                AND ${notDeletedCondition("user", "u")}
                AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
            ) AS user_data
          ) AS user
        FROM artists ar
        JOIN artist_history arh ON arh.artist_id = ar.id
        WHERE arh.user_id = $1
          AND ${notDeletedCondition("artist", "ar")}
        ORDER BY ar.id, arh.played_at DESC
        LIMIT $2 OFFSET $3
      `;

      const [songsResult, albumsResult, playlistsResult, artistsResult] =
        await Promise.all([
          query(songsSql, [userId, limit, offset]),
          query(albumsSql, [userId, limit, offset]),
          query(playlistsSql, [userId, limit, offset]),
          query(artistsSql, [userId, limit, offset]),
        ]);

      const songs: Song[] = (songsResult || []).map((song: Song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }

        if (song.albums?.length) {
          song.albums.forEach((album) => {
            if (album.image_url) {
              album.image_url = getBlobUrl(album.image_url);
            }
            if (album.artist?.banner_image_url) {
              album.artist.banner_image_url = getBlobUrl(
                album.artist.banner_image_url
              );
            }
          });
        }

        if (song.artists?.length) {
          song.artists.forEach((artist) => {
            if (artist.banner_image_url) {
              artist.banner_image_url = getBlobUrl(artist.banner_image_url);
            }
            if (artist.user?.profile_picture_url) {
              artist.user.profile_picture_url = getBlobUrl(
                artist.user.profile_picture_url
              );
            }
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
          if (album.artist.banner_image_url) {
            album.artist.banner_image_url = getBlobUrl(
              album.artist.banner_image_url
            );
          }
          if (album.artist.user?.profile_picture_url) {
            album.artist.user.profile_picture_url = getBlobUrl(
              album.artist.user.profile_picture_url
            );
          }
        }

        album.type = "album";
        return album;
      });

      const playlists: LibraryPlaylist[] = (playlistsResult || []).map(
        (playlist: LibraryPlaylist) => {
          if (playlist.user?.profile_picture_url) {
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
        if (artist.banner_image_url) {
          artist.banner_image_url = getBlobUrl(artist.banner_image_url);
        }

        if (artist.user?.profile_picture_url) {
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

  static async getLibrarySongs(
    userId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Song[]> {
    try {
      const { limit = 50, offset = 0 } = options || {};

      const sql = `
        SELECT DISTINCT ON (s.id)
          s.*,
          sl.liked_at,
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'title', a.title,
                'image_url', a.image_url,
                'image_url_blurhash', a.image_url_blurhash,
                'owner_id', a.owner_id,
                'visibility_status', a.visibility_status,
                'release_date', a.release_date,
                'genre', a.genre,
                'created_at', a.created_at,
                'updated_at', a.updated_at,
                'type', 'album',
                'artist', json_build_object(
                  'id', ar_album.id,
                  'display_name', ar_album.display_name,
                  'bio', ar_album.bio,
                  'user_id', ar_album.user_id,
                  'verified', ar_album.verified,
                  'location', ar_album.location,
                  'banner_image_url', ar_album.banner_image_url,
                  'banner_image_url_blurhash', ar_album.banner_image_url_blurhash,
                  'created_at', ar_album.created_at,
                  'updated_at', ar_album.updated_at,
                  'type', 'artist'
                )
              )
            )
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar_album ON ar_album.id = a.created_by
            WHERE als.song_id = s.id
              AND ${notDeletedCondition("album", "a")}
              AND (a.visibility_status = 'PUBLIC' OR a.owner_id = '${userId}')
              AND (ar_album.id IS NULL OR ${notDeletedCondition(
                "artist",
                "ar_album"
              )})
          ) AS albums,
          (
            SELECT json_agg(
              json_build_object(
                'id', ar.id,
                'display_name', ar.display_name,
                'bio', ar.bio,
                'user_id', ar.user_id,
                'verified', ar.verified,
                'location', ar.location,
                'banner_image_url', ar.banner_image_url,
                'banner_image_url_blurhash', ar.banner_image_url_blurhash,
                'created_at', ar.created_at,
                'updated_at', ar.updated_at,
                'role', sa.role,
                'type', 'artist',
                'user', json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'email', u.email,
                  'profile_picture_url', u.profile_picture_url,
                  'pfp_blurhash', u.pfp_blurhash,
                  'role', u.role,
                  'is_private', u.is_private,
                  'status', u.status,
                  'artist_id', u.artist_id,
                  'created_at', u.created_at,
                  'updated_at', u.updated_at
                )
              )
            )
            FROM song_artists sa
            JOIN artists ar ON ar.id = sa.artist_id
            JOIN users u ON u.id = ar.user_id
            WHERE sa.song_id = s.id
              AND ${notDeletedCondition("artist", "ar")}
              AND ${notDeletedCondition("user", "u")}
              AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
          ) AS artists,
          (
            SELECT COUNT(*)
            FROM song_likes sl2
            WHERE sl2.song_id = s.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM comments c
            WHERE c.song_id = s.id
              AND ${notDeletedCondition("comment", "c")}
          ) AS comments,
          EXISTS (
            SELECT 1 
            FROM trending_songs ts 
            WHERE ts.song_id = s.id
          ) AS is_trending
        FROM songs s
        JOIN song_likes sl ON sl.song_id = s.id
        WHERE sl.user_id = $1
          AND ${notDeletedCondition("song", "s")}
          AND (s.visibility_status = 'PUBLIC' OR s.owner_id = '${userId}')
        ORDER BY s.id, sl.liked_at DESC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [userId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const songs: Song[] = res.map((song: Song) => {
        if (song.image_url) {
          song.image_url = getBlobUrl(song.image_url);
        }
        if (song.audio_url) {
          song.audio_url = getBlobUrl(song.audio_url);
        }

        if (song.albums?.length) {
          song.albums.forEach((album) => {
            if (album.image_url) {
              album.image_url = getBlobUrl(album.image_url);
            }
            if (album.artist?.banner_image_url) {
              album.artist.banner_image_url = getBlobUrl(
                album.artist.banner_image_url
              );
            }
          });
        }

        if (song.artists?.length) {
          song.artists.forEach((artist) => {
            if (artist.banner_image_url) {
              artist.banner_image_url = getBlobUrl(artist.banner_image_url);
            }
            if (artist.user?.profile_picture_url) {
              artist.user.profile_picture_url = getBlobUrl(
                artist.user.profile_picture_url
              );
            }
          });
        }

        song.type = "song";
        return song;
      });

      return songs;
    } catch (error) {
      console.error("Error fetching library songs:", error);
      throw error;
    }
  }

  static async getLibraryPlaylists(
    userId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<LibraryPlaylist[]> {
    try {
      const { limit = 50, offset = 0 } = options || {};

      const sql = `
        SELECT DISTINCT ON (p.id)
          p.*,
          COALESCE(pl.liked_at, p.created_at) AS liked_at,
          EXISTS (
            SELECT 1 FROM user_playlist_pins upp
            WHERE upp.user_id = $1 AND upp.playlist_id = p.id
          ) AS is_pinned,
          (
            SELECT ph.played_at
            FROM playlist_history ph
            WHERE ph.playlist_id = p.id AND ph.user_id = $1
            ORDER BY ph.played_at DESC
            LIMIT 1
          ) AS played_at,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = p.owner_id
                AND ${notDeletedCondition("user", "u")}
                AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
            ) AS user_data
          ) AS user,
          (
            SELECT COUNT(*)
            FROM playlist_likes pl2
            WHERE pl2.playlist_id = p.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT COALESCE(SUM(s.duration), 0)
            FROM songs s
            JOIN playlist_songs ps ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT json_agg(ps.song_id ORDER BY ps.position)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids,
          (
            SELECT EXISTS (
              SELECT 1
              FROM playlist_songs ps
              JOIN songs s ON s.id = ps.song_id
              WHERE ps.playlist_id = p.id
                AND ${notDeletedCondition("song", "s")}
            )
          ) AS has_song
          
        FROM playlists p
        LEFT JOIN playlist_likes pl ON pl.playlist_id = p.id AND pl.user_id = $1
        WHERE (pl.user_id = $1 OR p.owner_id = $1)
          AND ${notDeletedCondition("playlist", "p")}
          AND (p.visibility_status = 'PUBLIC' OR p.owner_id = '${userId}')
        ORDER BY p.id, COALESCE(pl.liked_at, p.created_at) DESC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [userId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const playlists: LibraryPlaylist[] = res.map((playlist) => {
        if (playlist.user?.profile_picture_url) {
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
      });

      return playlists;
    } catch (error) {
      console.error("Error fetching library playlists:", error);
      throw error;
    }
  }

  static async getLibraryArtists(
    userId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Artist[]> {
    try {
      const { limit = 50, offset = 0 } = options || {};

      const sql = `
        SELECT DISTINCT ON (ar.id)
          ar.*,
          uf.followed_at AS followed_at,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = ar.user_id
                AND ${notDeletedCondition("user", "u")}
                AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))
            ) AS user_data
          ) AS user
        FROM artists ar
        JOIN users u_artist ON u_artist.id = ar.user_id
        JOIN user_followers uf ON uf.following_id = u_artist.id
        WHERE uf.follower_id = $1
          AND ${notDeletedCondition("artist", "ar")}
        ORDER BY ar.id, uf.followed_at DESC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [userId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const artists: Artist[] = res.map((artist) => {
        if (artist.banner_image_url) {
          artist.banner_image_url = getBlobUrl(artist.banner_image_url);
        }

        if (artist.user?.profile_picture_url) {
          artist.user.profile_picture_url = getBlobUrl(
            artist.user.profile_picture_url
          );
        }

        artist.type = "artist";
        return artist;
      });

      return artists;
    } catch (error) {
      console.error("Error fetching library artists:", error);
      throw error;
    }
  }

  static async getLibraryAlbums(
    userId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Album[]> {
    try {
      const { limit = 50, offset = 0 } = options || {};

      const sql = `
        SELECT DISTINCT ON (a.id)
          a.*,
          al.liked_at,
          (
            SELECT row_to_json(artist_with_user)
            FROM (
              SELECT 
                ar.id,
                ar.display_name,
                ar.bio,
                ar.user_id,
                ar.verified,
                ar.location,
                ar.banner_image_url,
                ar.banner_image_url_blurhash,
                ar.created_at,
                ar.updated_at,
                'artist' AS type,
                row_to_json(u.*) AS user
              FROM artists ar
              LEFT JOIN users u ON u.id = ar.user_id
              WHERE ar.id = a.created_by
                AND ${notDeletedCondition("artist", "ar")}
                AND (u.id IS NULL OR (${notDeletedCondition(
                  "user",
                  "u"
                )} AND (u.status IN ('ACTIVE', 'DEACTIVATED') AND (u.is_private = FALSE OR u.id = '${userId}'))))
            ) AS artist_with_user
          ) AS artist,
          (
            SELECT COUNT(*)
            FROM album_likes al2
            WHERE al2.album_id = a.id
          ) AS likes,
          (
            SELECT SUM(s.duration)
            FROM songs s
            JOIN album_songs als ON als.song_id = s.id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT COUNT(*)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT json_agg(als.song_id)
            FROM album_songs als
            JOIN songs s ON s.id = als.song_id
            WHERE als.album_id = a.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids
        FROM albums a
        JOIN album_likes al ON al.album_id = a.id
        WHERE al.user_id = $1
          AND ${notDeletedCondition("album", "a")}
          AND (a.visibility_status = 'PUBLIC' OR a.owner_id = '${userId}')
        ORDER BY a.id, al.liked_at DESC
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [userId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const albums: Album[] = res.map((album) => {
        if (album.image_url) {
          album.image_url = getBlobUrl(album.image_url);
        }

        if (album.artist) {
          if (album.artist.banner_image_url) {
            album.artist.banner_image_url = getBlobUrl(
              album.artist.banner_image_url
            );
          }
          if (album.artist.user?.profile_picture_url) {
            album.artist.user.profile_picture_url = getBlobUrl(
              album.artist.user.profile_picture_url
            );
          }
        }

        album.type = "album";
        return album;
      });

      return albums;
    } catch (error) {
      console.error("Error fetching library albums:", error);
      throw error;
    }
  }

  static async togglePinPlaylist(
    userId: UUID,
    playlistId: UUID
  ): Promise<boolean> {
    try {
      const userDeleted = await isDeleted(userId, "user");
      if (userDeleted) {
        throw new Error("User is deleted");
      }
      const playlistDeleted = await isDeleted(playlistId, "playlist");
      if (playlistDeleted) {
        throw new Error("Playlist is deleted");
      }

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
