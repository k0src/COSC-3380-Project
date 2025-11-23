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
}
