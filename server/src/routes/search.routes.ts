import express, { Request, Response } from "express";
import { getBlobUrl } from "../config/blobStorage.js";
import { pool } from "../config/database.js";

const router = express.Router();

// GET /api/search?q=query&type=all|songs|artists|albums|playlists&limit=20&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { q, type = "all", limit = "20", offset = "0" } = req.query;

  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Search query (q) is required" });
    return;
  }

  try {
    
    const searchTerm = `%${q.toLowerCase()}%`;
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    const results: any = {};

    // Search songs
    if (type === "all" || type === "songs") {
      const songsQuery = `
        SELECT s.song_id as id, s.title, s.duration, s.play_count as plays,
               s.likes, s.comments, s.cover_image_url as image,
               a.name as artist
        FROM songs s
        LEFT JOIN artists a ON s.artist_id = a.artist_id
        WHERE LOWER(s.title) LIKE $1 OR LOWER(a.name) LIKE $1
        ORDER BY s.play_count DESC
        LIMIT $2 OFFSET $3
      `;
      const songsResult = await pool.query(songsQuery, [searchTerm, limitNum, offsetNum]);
      results.songs = songsResult.rows.map((row: any) => ({
        ...row,
        image: row.image ? getBlobUrl(row.image) : "/PlayerBar/Mask group.png",
      }));
    }

    // Search artists
    if (type === "all" || type === "artists") {
      const artistsQuery = `
        SELECT artist_id as id, name, profile_image_url as image,
               bio, monthly_listeners as plays
        FROM artists
        WHERE LOWER(name) LIKE $1
        ORDER BY monthly_listeners DESC
        LIMIT $2 OFFSET $3
      `;
      const artistsResult = await pool.query(artistsQuery, [searchTerm, limitNum, offsetNum]);
      results.artists = artistsResult.rows.map((row: any) => ({
        ...row,
        image: row.image ? getBlobUrl(row.image) : "/PlayerBar/Mask group.png",
        likes: 0,
        comments: 0,
      }));
    }

    // Search albums
    if (type === "all" || type === "albums") {
      const albumsQuery = `
        SELECT al.album_id as id, al.title, al.cover_image_url as image,
               al.release_date, a.name as artist
        FROM albums al
        LEFT JOIN artists a ON al.artist_id = a.artist_id
        WHERE LOWER(al.title) LIKE $1 OR LOWER(a.name) LIKE $1
        ORDER BY al.release_date DESC
        LIMIT $2 OFFSET $3
      `;
      const albumsResult = await pool.query(albumsQuery, [searchTerm, limitNum, offsetNum]);
      results.albums = albumsResult.rows.map((row: any) => ({
        ...row,
        image: row.image ? getBlobUrl(row.image) : "/PlayerBar/Mask group.png",
        plays: 0,
        likes: 0,
        comments: 0,
      }));
    }

    // Search playlists
    if (type === "all" || type === "playlists") {
      const playlistsQuery = `
        SELECT p.playlist_id as id, p.name as title, p.cover_image_url as image,
               p.description, u.username as artist
        FROM playlists p
        LEFT JOIN users u ON p.user_id = u.user_id
        WHERE LOWER(p.name) LIKE $1 OR LOWER(p.description) LIKE $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const playlistsResult = await pool.query(playlistsQuery, [searchTerm, limitNum, offsetNum]);
      results.playlists = playlistsResult.rows.map((row: any) => ({
        ...row,
        image: row.image ? getBlobUrl(row.image) : "/PlayerBar/Mask group.png",
        plays: 0,
        likes: 0,
        comments: 0,
      }));
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error in /api/search:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;