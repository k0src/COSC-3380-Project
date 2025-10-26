import express, { Request, Response } from "express";
import { PlaylistRepository } from "@repositories";

const router = express.Router();

// GET /api/playlists
// Example:
// /api/playlists?includeUser=true&includeLikes=true&includeSongCount=true&limit=50&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeUser, includeLikes, includeSongCount, limit, offset } =
      req.query;

    const playlists = await PlaylistRepository.getMany({
      includeUser: includeUser === "true",
      includeLikes: includeLikes === "true",
      includeSongCount: includeSongCount === "true",
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(playlists);
  } catch (error) {
    console.error("Error in GET /playlists/:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/playlists/:id
// Example:
// /api/playlists/:id?includeUser=true&includeLikes=true&includeSongCount=true
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { includeUser, includeLikes, includeSongCount } = req.query;

  if (!id) {
    res.status(400).json({ error: "Playlist ID is required" });
    return;
  }

  try {
    const playlist = await PlaylistRepository.getOne(id, {
      includeUser: includeUser === "true",
      includeLikes: includeLikes === "true",
      includeSongCount: includeSongCount === "true",
    });

    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }

    res.status(200).json(playlist);
  } catch (error) {
    console.error("Error in GET /playlists/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
