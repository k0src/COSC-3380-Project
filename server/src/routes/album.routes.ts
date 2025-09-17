import express, { Request, Response } from "express";
import { AlbumQuery } from "@data";

const router = express.Router();

// GET /api/albums/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "Album ID is required" });
    return;
  }

  try {
    const album = await AlbumQuery.getById(id).exec();

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

// GET /api/albums/:id/details
router.get(
  "/:id/details",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Album ID is required" });
      return;
    }

    try {
      const album = await AlbumQuery.getById(id)
        .withSongs()
        .withArtist()
        .withRuntime()
        .exec();

      if (!album) {
        res.status(404).json({ error: "Album not found" });
        return;
      }

      res.status(200).json(album);
    } catch (error) {
      console.error("Error in GET /albums/:id/details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
