import express, { Request, Response } from "express";
import { ArtistRepository } from "@repositories";
import { UUID } from "@types";

const router = express.Router();

// GET /api/artists
// Example:
// /api/artists?includeUser=true&limit=50&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeUser, limit, offset, exclude } = req.query;

    // const artists = await ArtistRepository.getMany({
    //   includeUser: includeUser === "true",
    //   limit: limit ? parseInt(limit as string, 10) : undefined,
    //   offset: offset ? parseInt(offset as string, 10) : undefined,
    // });
    const artists = await ArtistRepository.getOtherArtists(exclude as UUID, {
        includeUser: includeUser === "true",
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
    

    res.status(200).json(artists);
  } catch (error) {
    console.error("Error in GET /artists/:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/artists/:id
// Example:
// /api/artist/:id?includeUser=true
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { includeUser } = req.query;

  if (!id) {
    res.status(400).json({ error: "Artist ID is required" });
    return;
  }

  try {
    const artist = await ArtistRepository.getOne(id, {
      includeUser: includeUser === "true",
    });

    if (!artist) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }

    res.status(200).json(artist);
  } catch (error) {
    console.error("Error in GET /artists/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/songs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Artist ID is required" });
      return;
    }

    const songs = await ArtistRepository.getSongs(id, {
      includeAlbum: req.query.includeAlbum === "true",
      includeLikes: req.query.includeLikes === "true",
      limit: req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined,
      offset: req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : undefined,
    });

    res.status(200).json(songs);
  } catch (error) {
    console.error("Error in GET /artists/:id/songs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/albums", async (req: Request, res: Response) => {
  const { id } = req.params ;
  const { 
    includeLikes, 
    includeRuntime, 
    includeSongCount, 
    limit, 
    offset 
  } = req.query;

  try {
    const albums = await ArtistRepository.getAlbums(id, {
      includeLikes: includeLikes === "true",
      includeRuntime: includeRuntime === "true",
      includeSongCount: includeSongCount === "true",
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    if (!albums) {
      return res.status(404).json({ error: "Albums not found for this artist" });
    }

    res.status(200).json(albums);
  } catch (error) {
    console.error("Error in GET /artists/:id/albums:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
