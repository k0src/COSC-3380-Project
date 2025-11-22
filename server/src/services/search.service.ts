import type {
  Song,
  Album,
  User,
  Artist,
  Playlist,
  AccessContext,
} from "@types";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { getAccessPredicate } from "@util";
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
    accessContext: AccessContext,
    options?: { ownerId?: string; limit?: number; offset?: number }
  ): Promise<SearchResults> {
    try {
      const { ownerId, limit = 20, offset = 0 } = options || {};

      const [songs, albums, artists, playlists, users] = await Promise.all([
        this.searchSongs(q, accessContext, { ownerId, limit, offset }),
        this.searchAlbums(q, accessContext, { ownerId, limit, offset }),
        this.searchArtists(q, accessContext, { limit, offset }),
        this.searchPlaylists(q, accessContext, { ownerId, limit, offset }),
        this.searchUsers(q, accessContext, { limit, offset }),
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

  static async searchUsers(
    q: string,
    accessContext: AccessContext,
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
    accessContext: AccessContext,
    options?: { ownerId?: string; limit?: number; offset?: number }
  ): Promise<Song[]> {
    try {
      const { ownerId, limit = 20, offset = 0 } = options || {};

      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "s", 3);
      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      let sql = `
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
          similarity(s.title, $1) as sim
        FROM songs s
        WHERE (s.title ILIKE $2 OR similarity(s.title, $1) > 0.2) AND (${predicateSql})`;

      const params: any[] = [q, `%${q}%`, ...predicateParams];
      let paramIndex = 3 + predicateParams.length;

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
    accessContext: AccessContext,
    options?: { ownerId?: string; limit?: number; offset?: number }
  ): Promise<Album[]> {
    try {
      const { ownerId, limit = 20, offset = 0 } = options || {};

      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "a", 3);
      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      let sql = `
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
          similarity(a.title, $1) as sim
        FROM albums a
        WHERE (a.title ILIKE $2 OR similarity(a.title, $1) > 0.2) AND (${predicateSql})`;

      const params: any[] = [q, `%${q}%`, ...predicateParams];
      let paramIndex = 3 + predicateParams.length;

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
    accessContext: AccessContext,
    options?: { ownerId?: string; limit?: number; offset?: number }
  ): Promise<Playlist[]> {
    try {
      const { ownerId, limit = 20, offset = 0 } = options || {};

      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "p", 3);
      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      let sql = `
        SELECT p.*,
          row_to_json(u.*) as user,
          (SELECT COUNT(*) FROM playlist_songs ps
          WHERE ps.playlist_id = p.id) as song_count,
          similarity(p.title, $1) as sim,
          EXISTS (SELECT 1 FROM playlist_songs 
                  ps WHERE ps.playlist_id = p.id) 
                  AS has_song
        FROM playlists p
        LEFT JOIN users u ON p.owner_id = u.id
        WHERE (p.title ILIKE $2 OR similarity(p.title, $1) > 0.2) AND (${predicateSql})`;

      const params: any[] = [q, `%${q}%`, ...predicateParams];
      let paramIndex = 3 + predicateParams.length;

      if (ownerId) {
        sql += ` AND p.owner_id = $${paramIndex}`;
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
    accessContext: AccessContext,
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
