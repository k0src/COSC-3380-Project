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

    // Search songs - search in title and genre
    if (type === "all" || type === "songs") {
      try {
        const songsQuery = `
          SELECT id, title, image_url as image, genre
          FROM "songs"
          WHERE LOWER(title) LIKE $1 OR LOWER(COALESCE(genre, '')) LIKE $1
          ORDER BY title
          LIMIT $2 OFFSET $3
        `;
        const songsResult = await pool.query(songsQuery, [searchTerm, limitNum, offsetNum]);
        results.songs = songsResult.rows.map((row: any) => ({
          ...row,
          image: row.image || "/PlayerBar/Mask group.png",
          artist: row.genre || "Unknown",
          plays: 0,
          likes: 0,
          comments: 0,
        }));
      } catch (err) {
        console.error("Error searching songs:", err);
        results.songs = [];
      }
    }

    // Search artists - search in display_name and bio
    if (type === "all" || type === "artists") {
      try {
        const artistsQuery = `
          SELECT id, display_name as name, bio
          FROM "artists"
          WHERE LOWER(display_name) LIKE $1 OR LOWER(COALESCE(bio, '')) LIKE $1
          ORDER BY display_name
          LIMIT $2 OFFSET $3
        `;
        const artistsResult = await pool.query(artistsQuery, [searchTerm, limitNum, offsetNum]);
        results.artists = artistsResult.rows.map((row: any) => ({
          ...row,
          image: "/PlayerBar/Mask group.png",
          plays: 0,
          likes: 0,
          comments: 0,
        }));
      } catch (err) {
        console.error("Error searching artists:", err);
        results.artists = [];
      }
    }

    // Search albums - search in title and created_by
    if (type === "all" || type === "albums") {
      try {
        const albumsQuery = `
          SELECT id, title, image_url as image, created_by
          FROM "albums"
          WHERE LOWER(title) LIKE $1 OR LOWER(COALESCE(created_by, '')) LIKE $1
          ORDER BY title
          LIMIT $2 OFFSET $3
        `;
        const albumsResult = await pool.query(albumsQuery, [searchTerm, limitNum, offsetNum]);
        results.albums = albumsResult.rows.map((row: any) => ({
          ...row,
          image: row.image || "/PlayerBar/Mask group.png",
          artist: row.created_by || "Unknown",
          plays: 0,
          likes: 0,
          comments: 0,
        }));
      } catch (err) {
        console.error("Error searching albums:", err);
        results.albums = [];
      }
    }

    // Search playlists - search in title, description, and created_by
    if (type === "all" || type === "playlists") {
      try {
        const playlistsQuery = `
          SELECT id, title, description, created_by
          FROM "playlists"
          WHERE LOWER(title) LIKE $1 
             OR LOWER(COALESCE(description, '')) LIKE $1 
             OR LOWER(COALESCE(created_by, '')) LIKE $1
          ORDER BY title
          LIMIT $2 OFFSET $3
        `;
        const playlistsResult = await pool.query(playlistsQuery, [searchTerm, limitNum, offsetNum]);
        results.playlists = playlistsResult.rows.map((row: any) => ({
          ...row,
          image: "/PlayerBar/Mask group.png",
          artist: row.created_by || "Playlist",
          plays: 0,
          likes: 0,
          comments: 0,
        }));
      } catch (err) {
        console.error("Error searching playlists:", err);
        results.playlists = [];
      }
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error in /api/search:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;