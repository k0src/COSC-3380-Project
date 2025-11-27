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
  AccessContext,
} from "@types";
import { query, withTransaction } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { getAccessPredicate, isDeleted, notDeletedCondition } from "@util";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export default class LibraryService {
  static async search(
    userId: UUID,
    accessContext: AccessContext,
    q: string
  ): Promise<LibrarySearchResults> {
    try {
      const { sql: songPredicateSqlRaw, params: songPredicateParams } =
        getAccessPredicate(accessContext, "s", 2);
      const songPredicateSql =
        (songPredicateSqlRaw && songPredicateSqlRaw.trim()) || "TRUE";

      const { sql: albumPredicateSqlRaw, params: albumPredicateParams } =
        getAccessPredicate(accessContext, "a", 2);
      const albumPredicateSql =
        (albumPredicateSqlRaw && albumPredicateSqlRaw.trim()) || "TRUE";

      const { sql: playlistPredicateSqlRaw, params: playlistPredicateParams } =
        getAccessPredicate(accessContext, "p", 2);
      const playlistPredicateSql =
        (playlistPredicateSqlRaw && playlistPredicateSqlRaw.trim()) || "TRUE";

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
        WHERE sl.user_id = $1 AND s.title ILIKE $2 AND (${songPredicateSql})
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
          WHERE als.album_id = a.id
            AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = als.song_id)) as song_count
        FROM albums a
        JOIN album_likes al ON al.album_id = a.id
        WHERE al.user_id = $1 AND a.title ILIKE $2 AND (${albumPredicateSql})
        ORDER BY al.liked_at DESC
        LIMIT 50
      `;

      const playlistsSql = `
        SELECT p.*,
          row_to_json(u.*) as user,
          (SELECT COUNT(*) FROM playlist_songs ps
          WHERE ps.playlist_id = p.id
            AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = ps.song_id)) as song_count
        FROM playlists p
        LEFT JOIN users u ON p.owner_id = u.id
        JOIN playlist_likes pl ON pl.playlist_id = p.id
        WHERE pl.user_id = $1 AND p.title ILIKE $2 AND (${playlistPredicateSql})
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
          AND NOT EXISTS (
            SELECT 1 FROM deleted_artists da 
            WHERE da.artist_id = a.id
          )
        ORDER BY uf.followed_at DESC
        LIMIT 50
      `;

      const searchPattern = `%${q}%`;

      const [songsResult, albumsResult, playlistsResult, artistsResult] =
        await Promise.all([
          query(songsSql, [userId, searchPattern, ...songPredicateParams]),
          query(albumsSql, [userId, searchPattern, ...albumPredicateParams]),
          query(playlistsSql, [
            userId,
            searchPattern,
            ...playlistPredicateParams,
          ]),
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

  static async getRecentlyPlayed(
    userId: UUID,
    accessContext: AccessContext,
    maxItems: number = 10
  ): Promise<RecentlyPlayedItems> {
    try {
      const { sql: songPredicateSqlRaw, params: songPredicateParams } =
        getAccessPredicate(accessContext, "s", 1);
      const songPredicateSql =
        (songPredicateSqlRaw && songPredicateSqlRaw.trim()) || "TRUE";

      const { sql: albumPredicateSqlRaw, params: albumPredicateParams } =
        getAccessPredicate(accessContext, "a", 1);
      const albumPredicateSql =
        (albumPredicateSqlRaw && albumPredicateSqlRaw.trim()) || "TRUE";

      const { sql: playlistPredicateSqlRaw, params: playlistPredicateParams } =
        getAccessPredicate(accessContext, "p", 1);
      const playlistPredicateSql =
        (playlistPredicateSqlRaw && playlistPredicateSqlRaw.trim()) || "TRUE";

      const songLimitIndex = songPredicateParams.length + 2;
      const albumLimitIndex = albumPredicateParams.length + 2;
      const playlistLimitIndex = playlistPredicateParams.length + 2;

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
        WHERE sh.user_id = $1 AND (${songPredicateSql})
        GROUP BY s.id
        ORDER BY s.id, played_at DESC
        LIMIT $${songLimitIndex}
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
          WHERE als.album_id = a.id
            AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = als.song_id)) as song_count,
          MAX(ah.played_at) as played_at
        FROM albums a
        JOIN album_history ah ON ah.album_id = a.id
        WHERE ah.user_id = $1 AND (${albumPredicateSql})
        GROUP BY a.id
        ORDER BY a.id, played_at DESC
        LIMIT $${albumLimitIndex}
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
        LEFT JOIN users u ON p.owner_id = u.id
        JOIN playlist_history ph ON ph.playlist_id = p.id
        WHERE ph.user_id = $1 AND (${playlistPredicateSql})
        GROUP BY p.id, u.id
        ORDER BY p.id, is_pinned DESC, played_at DESC, p.id
        LIMIT $${playlistLimitIndex}
      `;

      const artistsSql = `
        SELECT DISTINCT ON (a.id) a.*,
          row_to_json(u.*) as user,
          MAX(arh.played_at) as played_at
        FROM artists a
        LEFT JOIN users u ON a.user_id = u.id
        JOIN artist_history arh ON arh.artist_id = a.id
        WHERE arh.user_id = $1 AND NOT EXISTS (
          SELECT 1 FROM deleted_artists da
          WHERE da.artist_id = a.id
        )
        GROUP BY a.id, u.id
        ORDER BY a.id, played_at DESC
        LIMIT $2
      `;

      const [songsResult, albumsResult, playlistsResult, artistsResult] =
        await Promise.all([
          query(songsSql, [userId, ...songPredicateParams, maxItems]),
          query(albumsSql, [userId, ...albumPredicateParams, maxItems]),
          query(playlistsSql, [userId, ...playlistPredicateParams, maxItems]),
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
    accessContext: AccessContext,
    maxItems: number = 10
  ): Promise<RecentlyPlayedItemsArray> {
    try {
      const { sql: songPredicateSqlRaw, params: songPredicateParams } =
        getAccessPredicate(accessContext, "s", 1);
      const songPredicateSql =
        (songPredicateSqlRaw && songPredicateSqlRaw.trim()) || "TRUE";

      const { sql: albumPredicateSqlRaw, params: albumPredicateParams } =
        getAccessPredicate(accessContext, "a", 1);
      const albumPredicateSql =
        (albumPredicateSqlRaw && albumPredicateSqlRaw.trim()) || "TRUE";

      const { sql: playlistPredicateSqlRaw, params: playlistPredicateParams } =
        getAccessPredicate(accessContext, "p", 1);
      const playlistPredicateSql =
        (playlistPredicateSqlRaw && playlistPredicateSqlRaw.trim()) || "TRUE";

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
        WHERE sh.user_id = $1 AND (${songPredicateSql})
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
          WHERE als.album_id = a.id
            AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = als.song_id)) as song_count,
          MAX(ah.played_at) as played_at
        FROM albums a
        JOIN album_history ah ON ah.album_id = a.id
        WHERE ah.user_id = $1 AND (${albumPredicateSql})
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
        LEFT JOIN users u ON p.owner_id = u.id
        JOIN playlist_history ph ON ph.playlist_id = p.id
        WHERE ph.user_id = $1 AND (${playlistPredicateSql})
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
        WHERE arh.user_id = $1 AND NOT EXISTS (
          SELECT 1 FROM deleted_artists da
          WHERE da.artist_id = a.id
        )
        GROUP BY a.id, u.id
        ORDER BY a.id, played_at DESC
      `;

      const [songsResult, albumsResult, playlistsResult, artistsResult] =
        await Promise.all([
          query(songsSql, [userId, ...songPredicateParams]),
          query(albumsSql, [userId, ...albumPredicateParams]),
          query(playlistsSql, [userId, ...playlistPredicateParams]),
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
  //done
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
  //done
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
  //done
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
  //done
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

  //done
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
