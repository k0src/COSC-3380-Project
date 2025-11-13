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
  } catch (error) {
    console.error("Search failed:", error);
    res.status(500).json({ error: "Internal server error." });
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
  } catch (error) {
    console.error("Search users failed:", error);
    res.status(500).json({ error: "Internal server error." });
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
  } catch (error) {
    console.error("Search songs failed:", error);
    res.status(500).json({ error: "Internal server error." });
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
  } catch (error) {
    console.error("Search albums failed:", error);
    res.status(500).json({ error: "Internal server error." });
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
  } catch (error) {
    console.error("Search artists failed:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
