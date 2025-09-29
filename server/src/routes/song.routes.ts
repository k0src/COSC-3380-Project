import express, { Request, Response } from "express";
import { SongRepository } from "@repositories";
import { SongData } from "@types";

const router = express.Router();

// GET /api/songs
// Example:
// /api/songs?includeAlbum=true&includeArtists=true&includeLikes=true&limit=50&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeAlbum, includeArtists, includeLikes, limit, offset } =
      req.query;

    const songs = await SongRepository.getMany({
      includeAlbum: includeAlbum === "true",
      includeArtists: includeArtists === "true",
      includeLikes: includeLikes === "true",
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(songs);
  } catch (error) {
    console.error("Error in GET /songs/:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/songs/:id
// Example:
// /api/songs/:id?includeAlbum=true&includeArtists=true&includeLikes=true
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { includeAlbum, includeArtists, includeLikes } = req.query;

  if (!id) {
    res.status(400).json({ error: "Song ID is required" });
    return;
  }

  try {
    const song = await SongRepository.getOne(id, {
      includeAlbum: includeAlbum === "true",
      includeArtists: includeArtists === "true",
      includeLikes: includeLikes === "true",
    });

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

// POST /api/songs/ -> create new song
// admin protection
//
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as SongData;

    /*
      in MW

      const fields = [ 
        { name: "image", maxCount: 1 }, 
        { name: "audio", maxCount: 1 } 
      ]


      .fields(fields)
    */

    // if (!req.files.audio) {
    //   res.status(400).json({ error: "Audio file is required" });
    // }

    // await SongRepository.create(data, files);
  } catch (error) {
    console.error("Error in POST /songs/:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/songs/:id -> update song

// DELETE /api/songs/:id -> delete song

// PUT /api/songs/:id/artist -> add artist to song

// DELETE /api/songs/:id/artist -> remove artist from song

// GET /api/songs/count

// GET /api/songs/album

// GET /api/songs/artists

export default router;
