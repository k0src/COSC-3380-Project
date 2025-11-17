import express, { Request, Response } from "express";
import { SearchService } from "@services";

const router = express.Router();

// GET /api/search?q=searchTerm
router.get("/", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: "Query parameter is required." });
    return;
  }

  try {
    const results = await SearchService.search(query);
    res.json(results);
  } catch (error: any) {
    console.error("Search failed:", error);
    // In development, return an empty result shape instead of failing the request
    res.json({
      songs: [],
      albums: [],
      artists: [],
      playlists: [],
      users: [],
    });
    return;
  }
});

// GET /api/search/users?q=searchTerm
router.get("/users", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: "Query parameter is required." });
    return;
  }

  try {
    const results = await SearchService.searchUsers(query);
    res.json(results);
  } catch (error: any) {
    console.error("Search users failed:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// GET /api/search/songs?q=searchTerm
router.get("/songs", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: "Query parameter is required." });
    return;
  }

  try {
    const results = await SearchService.searchSongs(query);
    res.json(results);
  } catch (error: any) {
    console.error("Search songs failed:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// GET /api/search/albums?q=searchTerm
router.get("/albums", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: "Query parameter is required." });
    return;
  }

  try {
    const results = await SearchService.searchAlbums(query);
    res.json(results);
  } catch (error: any) {
    console.error("Search albums failed:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// GET /api/search/artists?q=searchTerm
router.get("/artists", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: "Query parameter is required." });
    return;
  }

  try {
    const results = await SearchService.searchArtists(query);
    res.json(results);
  } catch (error: any) {
    console.error("Search artists failed:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

export default router;
