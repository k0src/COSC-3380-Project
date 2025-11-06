import express, { Request, Response } from "express";
import { getBlobUrl } from "../config/blobStorage.js"; // Used to resolve blob URLs
import { pool } from "../config/database.js";

const router = express.Router();

// Safe query helper: returns [] on failure
async function safeQuery<T = any>(sql: string, params: any[]): Promise<T[]> {
  try {
    const r = await pool.query(sql, params);
    return r.rows as T[];
  } catch (e) {
    console.error("Search query failed:", e);
    return [];
  }
}

// GET /api/search?q=query&type=all|songs|artists|albums|playlists&limit=20&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { q, type = "all", limit = "20", offset = "0" } = req.query;

  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Search query (q) is required" });
    return;
  }

  const searchTerm = `%${q}%`;
  const limitNum = parseInt(limit as string, 10);
  const offsetNum = parseInt(offset as string, 10);

  const results: any = {};

  // Songs
  if (type === "all" || type === "songs") {
    const songsQuery = `
      SELECT
        title,
        image_url AS image,
        genre
      FROM songs
      WHERE title ILIKE $1 OR genre ILIKE $1
      ORDER BY title ASC
      LIMIT $2 OFFSET $3
    `;
    const rows = await safeQuery(songsQuery, [searchTerm, limitNum, offsetNum]);
    results.songs = rows.map((row: any) => ({
      ...row,
      image: row.image ? getBlobUrl(row.image) : "/PlayerBar/Mask group.png", // Resolving blob URL
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
    const rows = await safeQuery(artistsQuery, [searchTerm, limitNum, offsetNum]);
    results.artists = rows.map((row: any) => ({
      ...row,
      image: row.image ? getBlobUrl(row.image) : "/PlayerBar/Mask group.png",
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
    const rows = await safeQuery(albumsQuery, [searchTerm, limitNum, offsetNum]);
    results.albums = rows.map((row: any) => ({
      ...row,
      image: row.image ? getBlobUrl(row.image) : "/PlayerBar/Mask group.png",
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
    const rows = await safeQuery(playlistsQuery, [searchTerm, limitNum, offsetNum]);
    results.playlists = rows.map((row: any) => ({
      ...row,
      image: row.image ? getBlobUrl(row.image) : "/PlayerBar/Mask group.png",
      plays: 0,
      likes: 0,
      comments: 0,
    }));
  }

  res.status(200).json(results);
});

export default router;