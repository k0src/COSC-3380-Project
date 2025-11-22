import type {
  AccessContext,
  Album,
  Artist,
  FeaturedPlaylist,
  Playlist,
  Song,
  SongOptions,
  UUID,
} from "@types";
import { query, withTransaction } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage.js";
import { getAccessPredicate } from "@util";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export type CoverEntityType = "song" | "playlist" | "album";

export default class AdminService {
  static async getFeaturedPlaylist(
    accessContext: AccessContext
  ): Promise<FeaturedPlaylist | null> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "p");
      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const sql = `
        SELECT p.*,
          row_to_json(u.*) as user,
          (SELECT COUNT(*) FROM playlist_songs ps
          JOIN songs s ON ps.song_id = s.id
          WHERE ps.playlist_id = p.id
            AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
          ) as song_count,
          (SELECT COUNT(*) FROM playlist_likes pl 
            WHERE pl.playlist_id = p.id) AS likes,
          (SELECT COALESCE(SUM(s.duration), 0) 
          FROM songs s
          JOIN playlist_songs ps ON ps.song_id = s.id
          WHERE ps.playlist_id = p.id
            AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
          ) AS runtime,
          (SELECT EXISTS (
            SELECT 1 FROM playlist_songs ps
            JOIN songs s ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id
          AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
          )) AS has_song
        FROM playlists p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN playlist_likes pl ON pl.playlist_id = p.id
        JOIN admin_featured_playlist afp ON afp.playlist_id = p.id
        WHERE (${predicateSql})
        LIMIT 1`;

      const result = await query(sql, [...predicateParams]);
      if (!result || result.length === 0) return null;

      const playlist: FeaturedPlaylist = result[0];

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
    } catch (error) {
      console.error("Error fetching featured playlist:", error);
      throw error;
    }
  }

  static async getEntityImageUrl(
    entityId: UUID,
    entityType: CoverEntityType
  ): Promise<string | null> {
    try {
      let sql;
      switch (entityType) {
        case "song": {
          sql = `SELECT image_url FROM songs
            WHERE id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_songs ds WHERE ds.song_id = songs.id
            )
            LIMIT 1`;
          break;
        }
        case "playlist": {
          sql = `SELECT id, image_url,
            (SELECT EXISTS (
              SELECT 1 FROM playlist_songs ps
              JOIN songs s ON ps.song_id = s.id
              WHERE ps.playlist_id = p.id
              AND NOT EXISTS (SELECT 1 FROM deleted_songs ds WHERE ds.song_id = s.id)
            )) AS has_song
            FROM playlists p
            WHERE id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_playlists dp WHERE dp.playlist_id = p.id
            )
            LIMIT 1`;
          break;
        }
        case "album": {
          sql = `SELECT image_url FROM albums
            WHERE id = $1
            AND NOT EXISTS (
              SELECT 1 FROM deleted_albums da WHERE da.album_id = albums.id
            )
            LIMIT 1`;
          break;
        }
        default:
          throw new Error("Invalid entity type");
      }

      const res = await query(sql, [entityId]);
      if (!res || res.length === 0) return null;

      const entity: Playlist | Song | Album = res[0];

      if (entityType === "playlist") {
        if (entity.image_url) {
          return getBlobUrl(entity.image_url);
        } else if ((entity as any).has_song) {
          return `${API_URL}/playlists/${entity.id}/cover-image`;
        } else {
          return null;
        }
      }

      return entity.image_url ? getBlobUrl(entity.image_url) : null;
    } catch (error) {
      console.error("Error fetching entity image URL:", error);
      throw error;
    }
  }

  static async getNewFromFollowedArtists(
    userId: UUID,
    accessContext: AccessContext,
    limit: number = 10
  ): Promise<Song[]> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "s", 1);

      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const userIdIndex = 1;
      const limitIndex = predicateParams.length + 2;

      const sql = `
        SELECT 
          s.*,
          (SELECT json_agg(row_to_json(album_with_artist))
            FROM (
              SELECT a.*, row_to_json(ar) AS artist
              FROM albums a
              JOIN album_songs als ON als.album_id = a.id
              LEFT JOIN artists ar ON ar.id = a.created_by
              WHERE als.song_id = s.id
            ) AS album_with_artist
          ) AS albums,
          (SELECT json_agg(row_to_json(ar_with_role))
            FROM (
              SELECT ar.*, sa.role, row_to_json(u) AS user
              FROM artists ar
              JOIN users u ON u.artist_id = ar.id
              JOIN song_artists sa ON sa.artist_id = ar.id
              WHERE sa.song_id = s.id
            ) AS ar_with_role
          ) AS artists
        FROM songs s
        JOIN song_artists sa ON sa.song_id = s.id
        JOIN artists a ON a.id = sa.artist_id
        JOIN users u ON u.artist_id = a.id
        LEFT JOIN user_followers uf ON uf.follower_id = $${userIdIndex} 
          AND uf.following_id = u.id
        WHERE uf.follower_id IS NOT NULL AND (${predicateSql})
        GROUP BY s.id
        ORDER BY s.release_date DESC
        LIMIT $${limitIndex}`;

      const params = [userId, ...predicateParams, limit];

      const songs = await query(sql, params);
      if (!songs || songs.length === 0) return [];

      return songs.map((song: Song) => {
        if (song.image_url) song.image_url = getBlobUrl(song.image_url);
        if (song.audio_url) song.audio_url = getBlobUrl(song.audio_url);

        if (song.albums?.length) {
          song.albums.forEach((album) => {
            if (album.image_url) album.image_url = getBlobUrl(album.image_url);
            if (album.artist) album.artist.type = "artist";
            album.type = "album";
          });
        }

        if (song.artists?.length) {
          song.artists.forEach((artist) => {
            if (artist.user?.profile_picture_url) {
              artist.user.profile_picture_url = getBlobUrl(
                artist.user.profile_picture_url
              );
            }
            artist.type = "artist";
          });
        }

        song.type = "song";
        return song;
      });
    } catch (error) {
      console.error("Error fetching new songs from followed artists:", error);
      throw error;
    }
  }

  static async getTopArtist(days: number): Promise<Artist | null> {
    try {
      const interval = `${days} days`;
      const sql = `
      SELECT 
        a.*,
        row_to_json(u.*) as user,
        (SELECT COUNT(DISTINCT sl.user_id)
          FROM song_likes sl
          JOIN song_artists sa ON sl.song_id = sa.song_id
          WHERE sa.artist_id = a.id
            AND sl.liked_at >= NOW() - INTERVAL '${interval}'
          ) as likes,
        (SELECT COUNT(*) 
         FROM song_history sh
         JOIN song_artists sa ON sh.song_id = sa.song_id
         WHERE sa.artist_id = a.id
           AND sh.played_at >= NOW() - INTERVAL '${interval}'
        ) as streams,
        (SELECT COUNT(*) FROM user_followers uf
         WHERE uf.following_id = u.id
           AND NOT EXISTS (
             SELECT 1 FROM deleted_users du 
             WHERE du.user_id = u.id
           )
        ) as followers
      FROM artists a
      JOIN users u ON a.user_id = u.id
      WHERE NOT EXISTS (
        SELECT 1 FROM deleted_artists da
        WHERE da.artist_id = a.id
      )
      ORDER BY streams DESC, likes DESC, followers DESC
      LIMIT 1`;

      const result = await query(sql);
      if (!result || result.length === 0) return null;

      const topArtist: Artist = result[0];
      if (topArtist.user && topArtist.user.profile_picture_url) {
        topArtist.user.profile_picture_url = getBlobUrl(
          topArtist.user.profile_picture_url
        );
      }
      if (topArtist.banner_image_url) {
        topArtist.banner_image_url = getBlobUrl(topArtist.banner_image_url);
      }
      topArtist.type = "artist";
      return topArtist;
    } catch (error) {
      console.error("Error fetching top artist:", error);
      throw error;
    }
  }

  static async getTrendingSongs(
    accessContext: AccessContext,
    options?: SongOptions
  ): Promise<Song[]> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "s");

      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const orderByColumn = options?.orderByColumn ?? "created_at";
      const orderByDirection =
        (options?.orderByDirection ?? "DESC").toUpperCase() === "ASC"
          ? "ASC"
          : "DESC";

      const orderByMap: Record<string, string> = {
        title: "s.title",
        created_at: "s.created_at",
        streams: "s.streams",
        release_date: "s.release_date",
        likes: "likes",
        comments: "comments",
        duration: "s.duration",
      };

      const sqlOrderByColumn = orderByMap[orderByColumn] ?? "s.created_at";

      const selectFields: string[] = ["s.*"];

      if (options?.includeAlbums) {
        selectFields.push(`
          (SELECT json_agg(row_to_json(album_with_artist))
            FROM (
              SELECT a.*, row_to_json(ar) AS artist
              FROM albums a
              JOIN album_songs als ON als.album_id = a.id
              LEFT JOIN artists ar ON ar.id = a.created_by
              WHERE als.song_id = s.id
                AND NOT EXISTS (
                  SELECT 1 FROM deleted_albums da WHERE da.album_id = a.id
                )
                AND NOT EXISTS (
                  SELECT 1 FROM deleted_artists dar WHERE dar.artist_id = ar.id
                )
            ) AS album_with_artist
          ) AS albums
        `);
      }

      if (options?.includeArtists) {
        selectFields.push(`
          (SELECT json_agg(row_to_json(ar_with_role))
            FROM (
              SELECT ar.*, sa.role, row_to_json(u) AS user
              FROM artists ar
              JOIN users u ON u.artist_id = ar.id
              JOIN song_artists sa ON sa.artist_id = ar.id
              WHERE sa.song_id = s.id
                AND NOT EXISTS (
                  SELECT 1 FROM deleted_artists da WHERE da.artist_id = ar.id
                )
                AND NOT EXISTS (
                  SELECT 1 FROM deleted_users du WHERE du.user_id = u.id
                )
            ) AS ar_with_role
          ) AS artists
        `);
      }

      if (options?.includeLikes) {
        selectFields.push(
          `(SELECT COUNT(*) FROM song_likes sl 
            WHERE sl.song_id = s.id AND NOT EXISTS (
              SELECT 1 FROM deleted_users du WHERE du.user_id = sl.user_id
            )
          ) AS likes`
        );
      }

      if (options?.includeComments) {
        selectFields.push(
          `(SELECT COUNT(*) FROM comments c 
            WHERE c.song_id = s.id AND NOT EXISTS (
              SELECT 1 FROM deleted_comments dc WHERE dc.comment_id = c.id
            )
          ) AS comments`
        );
      }

      const limitIndex = predicateParams.length + 1;
      const offsetIndex = predicateParams.length + 2;

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM songs s
        WHERE ${predicateSql} AND EXISTS (
          SELECT 1 FROM trending_songs ts WHERE ts.song_id = s.id
        )
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const params = [...predicateParams, limit, offset];

      const songs = await query(sql, params);
      if (!songs || songs.length === 0) return [];

      return songs.map((song: Song) => {
        if (song.image_url) song.image_url = getBlobUrl(song.image_url);
        if (song.audio_url) song.audio_url = getBlobUrl(song.audio_url);

        if (song.albums?.length) {
          song.albums.forEach((album) => {
            if (album.image_url) album.image_url = getBlobUrl(album.image_url);
            if (album.artist) album.artist.type = "artist";
            album.type = "album";
          });
        }

        if (song.artists?.length) {
          song.artists.forEach((artist) => {
            if (artist.user?.profile_picture_url) {
              artist.user.profile_picture_url = getBlobUrl(
                artist.user.profile_picture_url
              );
            }
            artist.type = "artist";
          });
        }

        song.type = "song";
        return song;
      });
    } catch (error) {
      console.error("Error fetching songs:", error);
      throw error;
    }
  }
}
