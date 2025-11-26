import type { Song, Album, User, Artist, Playlist } from "@types";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { notDeletedCondition } from "@util";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export interface SearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  users: User[];
  top_result?: Song | Album | Artist | Playlist | User;
}

export default class SearchService {
  static async search(
    q: string,
    options?: {
      userId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<SearchResults> {
    try {
      const { userId, limit = 20, offset = 0 } = options || {};

      const [songs, albums, artists, playlists, users] = await Promise.all([
        this.searchSongs(q, { userId, limit, offset }),
        this.searchAlbums(q, { userId, limit, offset }),
        this.searchArtists(q, { userId, limit, offset }),
        this.searchPlaylists(q, { userId, limit, offset }),
        this.searchUsers(q, { userId, limit, offset }),
      ]);

      const allResults = [
        ...songs.map((s) => ({ ...s, entity_type: "song" as const })),
        ...albums.map((a) => ({ ...a, entity_type: "album" as const })),
        ...artists.map((ar) => ({ ...ar, entity_type: "artist" as const })),
        ...playlists.map((p) => ({ ...p, entity_type: "playlist" as const })),
        ...users.map((u) => ({ ...u, entity_type: "user" as const })),
      ];

      let top_result: Song | Album | Artist | Playlist | User | undefined;

      if (allResults.length > 0) {
        const sorted = allResults.sort((a, b) => {
          const aScore = (a as any).sim || 0;
          const bScore = (b as any).sim || 0;
          return bScore - aScore;
        });

        const topEntity = sorted[0];
        delete (topEntity as any).sim;
        delete (topEntity as any).entity_type;
        top_result = topEntity as any;
      }

      return {
        songs,
        albums,
        artists,
        playlists,
        users,
        top_result,
      };
    } catch (error) {
      console.error("Search failed:", error);
      throw error;
    }
  }

  static async searchSongs(
    q: string,
    options?: {
      userId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Song[]> {
    try {
      const { userId, limit = 20, offset = 0 } = options || {};

      const userFilter = userId ? `AND s.owner_id = $4` : "";
      const params = userId
        ? [q, `%${q}%`, `${q}%`, userId, limit, offset]
        : [q, `%${q}%`, `${q}%`, limit, offset];
      const limitIndex = userId ? 5 : 4;
      const offsetIndex = userId ? 6 : 5;

      const sql = `
        SELECT 
          s.*,
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
                  'type', 'artist'
                )
              )
            )
            FROM albums a
            JOIN album_songs als ON als.album_id = a.id
            LEFT JOIN artists ar ON ar.id = a.created_by
            WHERE als.song_id = s.id
              AND ${notDeletedCondition("album", "a")}
              AND a.visibility_status = 'PUBLIC'
              AND (ar.id IS NULL OR ${notDeletedCondition("artist", "ar")})
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
              AND u.status = 'ACTIVE'
              AND u.is_private = FALSE
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
          ) AS is_trending,
          similarity(s.title, $1) AS sim
        FROM songs s
        WHERE (s.title ILIKE $2 OR similarity(s.title, $1) > 0.2)
          AND ${notDeletedCondition("song", "s")}
          AND s.visibility_status = 'PUBLIC'
          ${userFilter}
        ORDER BY 
          CASE 
            WHEN s.title ILIKE $3 THEN 1
            WHEN s.title ILIKE $2 THEN 2
            ELSE 3 
          END,
          similarity(s.title, $1) DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const results = await query(sql, params);
      if (!results || results.length === 0) {
        return [];
      }

      const songs: Song[] = results.map((song: Song) => {
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
      console.error("Search songs failed:", error);
      throw error;
    }
  }

  static async searchPlaylists(
    q: string,
    options?: {
      userId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Playlist[]> {
    try {
      const { userId, limit = 20, offset = 0 } = options || {};

      const userFilter = userId ? `AND p.owner_id = $4` : "";
      const params = userId
        ? [q, `%${q}%`, `${q}%`, userId, limit, offset]
        : [q, `%${q}%`, `${q}%`, limit, offset];
      const limitIndex = userId ? 5 : 4;
      const offsetIndex = userId ? 6 : 5;

      const sql = `
        SELECT 
          p.*,
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
                AND u.status = 'ACTIVE'
                AND u.is_private = FALSE
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
          ) AS has_song,
          similarity(p.title, $1) AS sim
        FROM playlists p
        WHERE (p.title ILIKE $2 OR similarity(p.title, $1) > 0.2)
          AND ${notDeletedCondition("playlist", "p")}
          AND p.visibility_status = 'PUBLIC'
          ${userFilter}
        ORDER BY 
          CASE 
            WHEN p.title ILIKE $3 THEN 1
            WHEN p.title ILIKE $2 THEN 2
            ELSE 3 
          END,
          similarity(p.title, $1) DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const results = await query(sql, params);
      if (!results || results.length === 0) {
        return [];
      }

      const playlists: Playlist[] = results.map((playlist) => {
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
      console.error("Search playlists failed:", error);
      throw error;
    }
  }

  static async searchArtists(
    q: string,
    options?: {
      userId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Artist[]> {
    try {
      const { userId, limit = 20, offset = 0 } = options || {};

      const mutualFollowersJoin = userId
        ? `JOIN users u_artist ON u_artist.id = ar.user_id
         JOIN user_followers uf1 ON uf1.follower_id = u_artist.id
         JOIN user_followers uf2 ON uf2.follower_id = u_artist.id`
        : "";
      const mutualFollowersFilter = userId
        ? `AND uf1.following_id = $4 AND uf2.following_id = $4`
        : "";

      const params = userId
        ? [q, `%${q}%`, `${q}%`, userId, limit, offset]
        : [q, `%${q}%`, `${q}%`, limit, offset];
      const limitIndex = userId ? 5 : 4;
      const offsetIndex = userId ? 6 : 5;

      const sql = `
        SELECT ${userId ? "DISTINCT ON (ar.id)" : ""}
          ar.*,
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
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = ar.user_id
                AND ${notDeletedCondition("user", "u")}
                AND u.status = 'ACTIVE'
                AND u.is_private = FALSE
            ) AS user_data
          ) AS user,
          similarity(ar.display_name, $1) AS sim,
          CASE 
            WHEN ar.display_name ILIKE $3 THEN 1
            WHEN ar.display_name ILIKE $2 THEN 2
            ELSE 3 
          END AS match_priority
        FROM artists ar
        ${mutualFollowersJoin}
        WHERE (ar.display_name ILIKE $2 OR similarity(ar.display_name, $1) > 0.2)
          AND ${notDeletedCondition("artist", "ar")}
          AND EXISTS (
            SELECT 1 FROM users u_check
            WHERE u_check.id = ar.user_id
              AND ${notDeletedCondition("user", "u_check")}
              AND u_check.status = 'ACTIVE'
              AND u_check.is_private = FALSE
          )
          ${mutualFollowersFilter}
        ORDER BY 
          ${userId ? "ar.id," : ""}
          match_priority,
          similarity(ar.display_name, $1) DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const results = await query(sql, params);
      if (!results || results.length === 0) {
        return [];
      }

      const artists: Artist[] = results.map((artist) => {
        delete (artist as any).match_priority;

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
      console.error("Search artists failed:", error);
      throw error;
    }
  }

  static async searchAlbums(
    q: string,
    options?: {
      userId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Album[]> {
    try {
      const { userId, limit = 20, offset = 0 } = options || {};

      const userFilter = userId ? `AND a.owner_id = $4` : "";
      const params = userId
        ? [q, `%${q}%`, `${q}%`, userId, limit, offset]
        : [q, `%${q}%`, `${q}%`, limit, offset];
      const limitIndex = userId ? 5 : 4;
      const offsetIndex = userId ? 6 : 5;

      const sql = `
        SELECT 
          a.*,
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
                )} AND u.status = 'ACTIVE' AND u.is_private = FALSE))
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
          ) AS song_ids,
          similarity(a.title, $1) AS sim
        FROM albums a
        WHERE (a.title ILIKE $2 OR similarity(a.title, $1) > 0.2)
          AND ${notDeletedCondition("album", "a")}
          AND a.visibility_status = 'PUBLIC'
          ${userFilter}
        ORDER BY 
          CASE 
            WHEN a.title ILIKE $3 THEN 1
            WHEN a.title ILIKE $2 THEN 2
            ELSE 3 
          END,
          similarity(a.title, $1) DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const results = await query(sql, params);
      if (!results || results.length === 0) {
        return [];
      }

      const albums: Album[] = results.map((album) => {
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
      console.error("Search albums failed:", error);
      throw error;
    }
  }

  static async searchUsers(
    q: string,
    options?: {
      userId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<User[]> {
    try {
      const { userId, limit = 20, offset = 0 } = options || {};

      const mutualFollowersJoin = userId
        ? `JOIN user_followers uf1 ON uf1.follower_id = u.id
         JOIN user_followers uf2 ON uf2.follower_id = u.id`
        : "";
      const mutualFollowersFilter = userId
        ? `AND uf1.following_id = $4 AND uf2.following_id = $4`
        : "";

      const params = userId
        ? [q, `%${q}%`, `${q}%`, userId, limit, offset]
        : [q, `%${q}%`, `${q}%`, limit, offset];
      const limitIndex = userId ? 5 : 4;
      const offsetIndex = userId ? 6 : 5;

      const sql = `
        SELECT ${userId ? "DISTINCT ON (u.id)" : ""}
          u.*,
          (
            SELECT COUNT(*)
            FROM user_followers uf
            WHERE uf.following_id = u.id
              AND NOT EXISTS (
                SELECT 1 FROM deleted_users du 
                WHERE du.user_id = uf.follower_id
              )
          ) AS follower_count,
          (
            SELECT COUNT(*)
            FROM user_followers uf
            WHERE uf.follower_id = u.id
              AND NOT EXISTS (
                SELECT 1 FROM deleted_users du 
                WHERE du.user_id = uf.following_id
              )
          ) AS following_count,
          similarity(u.username, $1) AS sim,
          CASE 
            WHEN u.username ILIKE $3 THEN 1
            WHEN u.username ILIKE $2 THEN 2
            ELSE 3 
          END AS match_priority
        FROM users u
        ${mutualFollowersJoin}
        WHERE (u.username ILIKE $2 OR similarity(u.username, $1) > 0.2)
          AND ${notDeletedCondition("user", "u")}
          AND u.status = 'ACTIVE'
          AND u.is_private = FALSE
          ${mutualFollowersFilter}
        ORDER BY 
          ${userId ? "u.id," : ""}
          match_priority,
          similarity(u.username, $1) DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const results = await query(sql, params);

      if (!results || results.length === 0) {
        return [];
      }

      const users: User[] = results.map((user) => {
        delete (user as any).match_priority;

        if (user.profile_picture_url) {
          user.profile_picture_url = getBlobUrl(user.profile_picture_url);
        }

        return user;
      });

      return users;
    } catch (error) {
      console.error("Search users failed:", error);
      throw error;
    }
  }
}
