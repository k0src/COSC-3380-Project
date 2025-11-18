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
  top_result?: Song | Album | Artist | Playlist | User;
}

/**
 * Service for handling search for songs, albums, artists, playlists, and users.
 */
export default class SearchService {
  static async search(
    q: string,
    options?: { ownerId?: string; limit?: number; offset?: number }
  ): Promise<SearchResults> {
    try {
      const { ownerId, limit = 20, offset = 0 } = options || {};

      let ownerFilter = "";
      const params: any[] = [q, `%${q}%`, `${q}%`];

      if (ownerId) {
        ownerFilter = ` AND owner_id = $4`;
        params.push(ownerId);
      }

      const sql = `
      WITH top_result_cte AS (
        SELECT * FROM (
          SELECT 
                 to_jsonb(s.*) || jsonb_build_object(
                   'entity_type', 'song',
                   'albums', (
                     SELECT json_agg(row_to_json(album_with_artist))
                     FROM (
                       SELECT a.*,
                         row_to_json(ar) AS artist
                       FROM albums a
                       JOIN album_songs als ON als.album_id = a.id
                       LEFT JOIN artists ar ON ar.id = a.created_by
                       WHERE als.song_id = s.id
                     ) AS album_with_artist
                   ),
                   'artists', (
                     SELECT json_agg(row_to_json(ar_with_role))
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
                   )
                 ) as data,
                 similarity(s.title, $1) as sim_score,
                 CASE WHEN s.title ILIKE $3 THEN 1
                      WHEN s.title ILIKE $2 THEN 2
                      ELSE 3 END as match_rank
          FROM songs s
          WHERE (s.title ILIKE $2 OR similarity(s.title, $1) > 0.2)${ownerFilter}
          
          UNION ALL
          
          SELECT 
                 to_jsonb(a.*) || jsonb_build_object(
                   'entity_type', 'album',
                   'artist', (
                     SELECT row_to_json(artist_with_user)
                     FROM (
                       SELECT ar.*,
                         row_to_json(u) AS user
                       FROM artists ar
                       LEFT JOIN users u ON ar.user_id = u.id
                       WHERE ar.id = a.created_by
                     ) AS artist_with_user
                   ),
                   'song_count', (
                     SELECT COUNT(*) FROM album_songs als 
                     WHERE als.album_id = a.id
                   )
                 ) as data,
                 similarity(a.title, $1) as sim_score,
                 CASE WHEN a.title ILIKE $3 THEN 1
                      WHEN a.title ILIKE $2 THEN 2
                      ELSE 3 END as match_rank
          FROM albums a
          WHERE (a.title ILIKE $2 OR similarity(a.title, $1) > 0.2)${ownerFilter}
          
          UNION ALL
          
          SELECT 
                 to_jsonb(ar.*) || jsonb_build_object(
                   'entity_type', 'artist',
                   'user', (
                     SELECT jsonb_build_object(
                       'id', u.id,
                       'username', u.username,
                       'email', u.email,
                       'role', u.role,
                       'profile_picture_url', u.profile_picture_url,
                       'created_at', u.created_at
                     )
                     FROM users u WHERE u.id = ar.user_id
                   )
                 ) as data,
                 similarity(ar.display_name, $1) as sim_score,
                 CASE WHEN ar.display_name ILIKE $3 THEN 1
                      WHEN ar.display_name ILIKE $2 THEN 2
                      ELSE 3 END as match_rank
          FROM artists ar
          WHERE (ar.display_name ILIKE $2 OR similarity(ar.display_name, $1) > 0.2)
          
          UNION ALL
          
          SELECT 
                 to_jsonb(p.*) || jsonb_build_object(
                   'entity_type', 'playlist',
                   'user', (
                     SELECT row_to_json(u.*)
                     FROM users u
                     WHERE u.id = p.created_by
                   ),
                   'song_count', (
                     SELECT COUNT(*) FROM playlist_songs ps
                     WHERE ps.playlist_id = p.id
                   )
                 ) as data,
                 similarity(p.title, $1) as sim_score,
                 CASE WHEN p.title ILIKE $3 THEN 1
                      WHEN p.title ILIKE $2 THEN 2
                      ELSE 3 END as match_rank
          FROM playlists p
          WHERE (p.title ILIKE $2 OR similarity(p.title, $1) > 0.2)
          
          UNION ALL
          
          SELECT 
                 to_jsonb(u.*) || jsonb_build_object('entity_type', 'user') as data,
                 similarity(u.username, $1) as sim_score,
                 CASE WHEN u.username ILIKE $3 THEN 1
                      WHEN u.username ILIKE $2 THEN 2
                      ELSE 3 END as match_rank
          FROM users u
          WHERE (u.username ILIKE $2 OR similarity(u.username, $1) > 0.2)
        ) all_results
        ORDER BY match_rank ASC, sim_score DESC
        LIMIT 1
      )
      SELECT
        (SELECT json_agg(subq) FROM (
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
            ) AS ar_with_role) AS artists,
            similarity(s.title, $1) as sim_score
          FROM songs s
          WHERE (s.title ILIKE $2 OR similarity(s.title, $1) > 0.2)${ownerFilter}
          ORDER BY
            CASE WHEN s.title ILIKE $3 THEN 1
                 WHEN s.title ILIKE $2 THEN 2
                 ELSE 3 END,
            similarity(s.title, $1) DESC
        ) subq) AS songs,
        
        (SELECT json_agg(subq) FROM (
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
            WHERE als.album_id = a.id) as song_count,
            similarity(a.title, $1) as sim_score
          FROM albums a
          WHERE (a.title ILIKE $2 OR similarity(a.title, $1) > 0.2)${ownerFilter}
          ORDER BY
            CASE WHEN a.title ILIKE $3 THEN 1
                 WHEN a.title ILIKE $2 THEN 2
                 ELSE 3 END,
            similarity(a.title, $1) DESC
        ) subq) AS albums,
        
        (SELECT json_agg(subq) FROM (
          SELECT 
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
            ) as user,
            similarity(ar.display_name, $1) as sim_score
          FROM artists ar
          JOIN users u ON ar.user_id = u.id
          WHERE (ar.display_name ILIKE $2 OR similarity(ar.display_name, $1) > 0.2)
          ORDER BY
            CASE WHEN ar.display_name ILIKE $3 THEN 1
                 WHEN ar.display_name ILIKE $2 THEN 2
                 ELSE 3 END,
            similarity(ar.display_name, $1) DESC
        ) subq) AS artists,
        
        (SELECT json_agg(subq) FROM (
          SELECT p.*,
            row_to_json(u.*) as user,
            (SELECT COUNT(*) FROM playlist_songs ps
            WHERE ps.playlist_id = p.id) as song_count,
            similarity(p.title, $1) as sim_score
          FROM playlists p
          LEFT JOIN users u ON p.created_by = u.id
          WHERE (p.title ILIKE $2 OR similarity(p.title, $1) > 0.2)
          ORDER BY
            CASE WHEN p.title ILIKE $3 THEN 1
                 WHEN p.title ILIKE $2 THEN 2
                 ELSE 3 END,
            similarity(p.title, $1) DESC
        ) subq) AS playlists,
        
        (SELECT json_agg(subq) FROM (
          SELECT u.*, similarity(u.username, $1) as sim_score
          FROM users u
          WHERE (u.username ILIKE $2 OR similarity(u.username, $1) > 0.2)
          ORDER BY
            CASE WHEN u.username ILIKE $3 THEN 1
                 WHEN u.username ILIKE $2 THEN 2
                 ELSE 3 END,
            similarity(u.username, $1) DESC
        ) subq) AS users,
        
        (SELECT data FROM top_result_cte) AS top_result
    `;

      const results = await query(sql, params);
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
                playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
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

      // Process top result
      let top_result: Song | Album | Artist | Playlist | User | undefined;
      if (row.top_result) {
        const topEntity = row.top_result;
        const entityType = topEntity.entity_type;

        switch (entityType) {
          case "song":
            if (topEntity.image_url) {
              topEntity.image_url = getBlobUrl(topEntity.image_url);
            }
            if (topEntity.audio_url) {
              topEntity.audio_url = getBlobUrl(topEntity.audio_url);
            }
            topEntity.type = "song";
            top_result = topEntity as Song;
            break;

          case "album":
            if (topEntity.image_url) {
              topEntity.image_url = getBlobUrl(topEntity.image_url);
            }
            topEntity.type = "album";
            top_result = topEntity as Album;
            break;

          case "artist":
            if (topEntity.user?.profile_picture_url) {
              topEntity.user.profile_picture_url = getBlobUrl(
                topEntity.user.profile_picture_url
              );
            }
            topEntity.type = "artist";
            top_result = topEntity as Artist;
            break;

          case "playlist":
            if (!topEntity.image_url) {
              topEntity.image_url = `${API_URL}/playlists/${topEntity.id}/cover-image`;
            }
            topEntity.type = "playlist";
            top_result = topEntity as Playlist;
            break;

          case "user":
            if (topEntity.profile_picture_url) {
              topEntity.profile_picture_url = getBlobUrl(
                topEntity.profile_picture_url
              );
            }
            top_result = topEntity as User;
            break;
        }
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

  static async searchUsers(
    q: string,
    options?: { limit?: number; offset?: number }
  ): Promise<User[]> {
    try {
      const { limit = 20, offset = 0 } = options || {};

      const sql = `
        SELECT *,
          similarity(u.username, $1) as sim
        FROM users u
        WHERE (u.username ILIKE $2 OR similarity(u.username, $1) > 0.2)
        ORDER BY
          CASE WHEN u.username ILIKE $3 THEN 1
            WHEN u.username ILIKE $2 THEN 2
            ELSE 3 END,
          similarity(u.username, $1) DESC
        LIMIT $4
        OFFSET $5`;

      const params = [q, `%${q}%`, `${q}%`, limit, offset];

      const results = await query(sql, params);
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

  static async searchSongs(
    q: string,
    options?: { ownerId?: string; limit?: number; offset?: number }
  ): Promise<Song[]> {
    try {
      const { ownerId, limit = 20, offset = 0 } = options || {};

      let sql = `
        SELECT *,
          similarity(s.title, $1) as sim
        FROM songs s
        WHERE (s.title ILIKE $2 OR similarity(s.title, $1) > 0.2)`;

      const params: any[] = [q, `%${q}%`];
      let paramIndex = 3;

      if (ownerId) {
        sql += ` AND s.owner_id = $${paramIndex}`;
        params.push(ownerId);
        paramIndex++;
      }

      sql += `
        ORDER BY 
          CASE WHEN s.title ILIKE $${paramIndex} THEN 1
            WHEN s.title ILIKE $2 THEN 2
            ELSE 3 END,
          similarity(s.title, $1) DESC
        LIMIT $${paramIndex + 1} 
        OFFSET $${paramIndex + 2}`;

      params.push(`${q}%`, limit, offset);

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

  static async searchAlbums(
    q: string,
    options?: { ownerId?: string; limit?: number; offset?: number }
  ): Promise<Album[]> {
    try {
      const { ownerId, limit = 20, offset = 0 } = options || {};

      let sql = `
        SELECT *,
          similarity(a.title, $1) as sim
        FROM albums a
        WHERE (a.title ILIKE $2 OR similarity(a.title, $1) > 0.2)`;

      const params: any[] = [q, `%${q}%`];
      let paramIndex = 3;

      if (ownerId) {
        sql += ` AND a.owner_id = $${paramIndex}`;
        params.push(ownerId);
        paramIndex++;
      }

      sql += `
        ORDER BY
          CASE WHEN a.title ILIKE $${paramIndex} THEN 1
            WHEN a.title ILIKE $2 THEN 2
            ELSE 3 END,
          similarity(a.title, $1) DESC
        LIMIT $${paramIndex + 1}
        OFFSET $${paramIndex + 2}`;

      params.push(`${q}%`, limit, offset);

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
  static async searchPlaylists(
    q: string,
    options?: { ownerId?: string; limit?: number; offset?: number }
  ): Promise<Playlist[]> {
    try {
      const { ownerId, limit = 20, offset = 0 } = options || {};

      let sql = `
        SELECT *,
          similarity(p.title, $1) as sim
        FROM playlists p
        WHERE (p.title ILIKE $2 OR similarity(p.title, $1) > 0.2)`;

      const params: any[] = [q, `%${q}%`];
      let paramIndex = 3;

      if (ownerId) {
        sql += ` AND p.created_by = $${paramIndex}`;
        params.push(ownerId);
        paramIndex++;
      }

      sql += `
        ORDER BY
          CASE WHEN p.title ILIKE $${paramIndex} THEN 1
            WHEN p.title ILIKE $2 THEN 2
            ELSE 3 END,
          similarity(p.title, $1) DESC
        LIMIT $${paramIndex + 1}
        OFFSET $${paramIndex + 2}`;

      params.push(`${q}%`, limit, offset);

      const results = await query(sql, params);
      if (!results || results.length === 0) {
        return [];
      }

      const processedPlaylists: Playlist[] = await Promise.all(
        results.map(async (playlist: Playlist) => {
          if (!playlist.image_url) {
            playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
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
  static async searchArtists(
    q: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Artist[]> {
    try {
      const { limit = 20, offset = 0 } = options || {};

      const sql = `
        SELECT 
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
          ) as user,
          similarity(ar.display_name, $1) as sim
        FROM artists ar
        JOIN users u ON ar.user_id = u.id
        WHERE (ar.display_name ILIKE $2 OR similarity(ar.display_name, $1) > 0.2)
        ORDER BY
          CASE WHEN ar.display_name ILIKE $3 THEN 1
            WHEN ar.display_name ILIKE $2 THEN 2
            ELSE 3 END,
          similarity(ar.display_name, $1) DESC
        LIMIT $4
        OFFSET $5`;

      const params = [q, `%${q}%`, `${q}%`, limit, offset];

      const results = await query(sql, params);
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
