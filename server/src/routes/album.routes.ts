import express, { Request, Response } from "express";
import { AlbumRepository } from "@repositories";

const router = express.Router();

// GET /api/albums
// Example:
// /api/albums?includeArtist=true&includeRuntime=true&includeSongCount=true&includeLikes=true&limit=50&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      includeArtist,
      includeRuntime,
      includeSongCount,
      includeLikes,
      limit,
      offset,
    } = req.query;

    const albums = await AlbumRepository.getMany({
      includeArtist: includeArtist === "true",
      includeRuntime: includeRuntime === "true",
      includeLikes: includeLikes === "true",
      includeSongCount: includeSongCount === "true",
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(albums);
  } catch (error) {
    console.error("Error in GET /albums/:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/albums/:id
// Example:
// /api/albums/:id?includeArtist=true&includeRuntime=true&includeSongCount=true&includeLikes=true
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { includeArtist, includeRuntime, includeSongCount, includeLikes } =
    req.query;

  if (!id) {
    res.status(400).json({ error: "Album ID is required" });
    return;
  }

  try {
    const album = await AlbumRepository.getOne(id, {
      includeArtist: includeArtist === "true",
      includeRuntime: includeRuntime === "true",
      includeLikes: includeLikes === "true",
      includeSongCount: includeSongCount === "true",
    });

    if (!album) {
      res.status(404).json({ error: "Album not found" });
      return;
    }

    res.status(200).json(album);
  } catch (error) {
    console.error("Error in GET /albums/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
