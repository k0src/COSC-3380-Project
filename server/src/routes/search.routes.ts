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
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
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

// GET /api/search/songs?q=searchTerm&ownerId=userId
router.get("/songs", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const ownerId = req.query.ownerId as string | undefined;
  if (!query) {
    res.status(400).json({ error: "Query parameter is required." });
    return;
  }

  try {
    const results = await SearchService.searchSongs(query, ownerId);
    res.json(results);
  } catch (error: any) {
    console.error("Search songs failed:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// GET /api/search/albums?q=searchTerm&ownerId=userId
router.get("/albums", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const ownerId = req.query.ownerId as string | undefined;
  if (!query) {
    res.status(400).json({ error: "Query parameter is required." });
    return;
  }

  try {
    const results = await SearchService.searchAlbums(query, ownerId);
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

// GET /api/search/playlists?q=searchTerm&ownerId=userId
router.get("/playlists", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const ownerId = req.query.ownerId as string | undefined;
  if (!query) {
    res.status(400).json({ error: "Query parameter is required." });
    return;
  }

  try {
    const results = await SearchService.searchPlaylists(query, ownerId);
    res.json(results);
  } catch (error: any) {
    console.error("Search playlists failed:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

export default router;
