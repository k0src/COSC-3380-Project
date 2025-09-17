import express, { Request, Response } from "express";
import { SongRepository as Song } from "@repositories";

const router = express.Router();

// GET /api/songs
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const songs = await Song.getMany({
      includeAlbum: true,
      includeArtists: true,
      includeLikes: true,
    });

    res.status(200).json(songs);
  } catch (error) {
    console.error("Error in GET /songs/:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/songs/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "Song ID is required" });
    return;
  }

  try {
    const song = await Song.getOne(id);

    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }

    res.status(200).json(song);
  } catch (error) {
    console.error("Error in GET /songs/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/songs/:id/details
router.get(
  "/:id/details",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Song ID is required" });
      return;
    }

    try {
      const song = await Song.getOne(id, {
        includeAlbum: true,
        includeArtists: true,
        includeLikes: true,
      });

      if (!song) {
        res.status(404).json({ error: "Song not found" });
        return;
      }

      res.status(200).json(song);
    } catch (error) {
      console.error("Error in GET /songs/:id/details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
