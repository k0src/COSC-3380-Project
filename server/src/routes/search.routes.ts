import express, { Request, Response } from "express";
import { getBlobUrl } from "@config/blobStorage"; // Used to resolve blob URLs
import { query as dbQuery } from "@config/database";

const router = express.Router();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

// Safe query helper: returns [] on failure
async function safeQuery<T = unknown>(sql: string, params: unknown[]): Promise<T[]> {
  try {
    return await dbQuery<T>(sql, params);
  } catch (e) {
    console.error("Search query failed:", e);
    return [];
  }
}

// GET /api/search?q=query&type=all|songs|artists|albums|playlists&limit=20&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const queryParams = (req as any).query as {
    q?: string;
    type?: string;
    limit?: string;
    offset?: string;
  };
  const { q, type = "all" } = queryParams;

  if (!q || typeof q !== "string") {
    (res as any).status(400).json({ error: "Search query (q) is required" });
    return;
  }

  const limitNum = parsePositiveInt(queryParams.limit, 20);
  const offsetNum = parsePositiveInt(queryParams.offset, 0);
  const searchTerm = `%${q}%`;

  const results: any = {};

  // Songs (include artists)
  if (type === "all" || type === "songs") {
    const songsQuery = `
      SELECT
        s.id,
        s.title,
        s.image_url AS image,
        s.genre,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', ar.user_id, 'name', ar.display_name))
            FROM song_artists sa
            JOIN artists ar ON sa.artist_id = ar.id
            WHERE sa.song_id = s.id
          ), '[]'::json
        ) AS artists
      FROM songs s
      WHERE s.title ILIKE $1 OR s.genre ILIKE $1
      ORDER BY s.title ASC
      LIMIT $2 OFFSET $3
    `;

    const rows = await safeQuery<Record<string, unknown>>(songsQuery, [
      searchTerm,
      limitNum,
      offsetNum,
    ]);
    results.songs = rows.map((row) => ({
      ...row,
      image:
        typeof row.image === "string"
          ? getBlobUrl(row.image)
          : "/PlayerBar/Mask group.png", // Resolving blob URL
    }));
  }

  // Artists (display_name and bio)
  if (type === "all" || type === "artists") {
    const artistsQuery = `
      SELECT user_id as id, display_name as name, bio, image_url AS image
      FROM artists
      WHERE display_name ILIKE $1 OR bio ILIKE $1
      LIMIT $2 OFFSET $3
    `;
    const rows = await safeQuery<Record<string, unknown>>(artistsQuery, [
      searchTerm,
      limitNum,
      offsetNum,
    ]);
    results.artists = rows.map((row) => ({
      ...row,
      image:
        typeof row.image === "string"
          ? getBlobUrl(row.image)
          : "/PlayerBar/Mask group.png",
      likes: 0,
      comments: 0,
    }));
  }

  // Albums (title only)
  if (type === "all" || type === "albums") {
    const albumsQuery = `
      SELECT
        title,
        image_url AS image,
        created_by AS artist
      FROM albums
      WHERE title ILIKE $1
      ORDER BY title ASC
      LIMIT $2 OFFSET $3
    `;
    const rows = await safeQuery<Record<string, unknown>>(albumsQuery, [
      searchTerm,
      limitNum,
      offsetNum,
    ]);
    results.albums = rows.map((row) => ({
      ...row,
      image:
        typeof row.image === "string"
          ? getBlobUrl(row.image)
          : "/PlayerBar/Mask group.png",
      plays: 0,
      likes: 0,
      comments: 0,
    }));
  }

  // Playlists (title and description only)
  if (type === "all" || type === "playlists") {
    const playlistsQuery = `
      SELECT
        title,
        description,
        created_by AS artist,
        image_url AS image
      FROM playlists
      WHERE title ILIKE $1 OR description ILIKE $1
      ORDER BY title ASC
      LIMIT $2 OFFSET $3
    `;
    const rows = await safeQuery<Record<string, unknown>>(playlistsQuery, [
      searchTerm,
      limitNum,
      offsetNum,
    ]);
    results.playlists = rows.map((row) => ({
      ...row,
      image:
        typeof row.image === "string"
          ? getBlobUrl(row.image)
          : "/PlayerBar/Mask group.png",
      plays: 0,
      likes: 0,
      comments: 0,
    }));
  }

  (res as any).status(200).json(results);
});

export default router;