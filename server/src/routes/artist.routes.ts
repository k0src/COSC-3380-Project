import express, { Request, Response } from "express";
import { ArtistRepository } from "@repositories";
import { validateOrderBy } from "@validators";

const router = express.Router();

// GET /api/artists
// Example:
// /api/artists?includeUser=true&limit=50&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeUser, orderByColumn, orderByDirection, limit, offset } =
      req.query;

    let column = (orderByColumn as string) || "created_at";
    let direction = (orderByDirection as string) || "DESC";

    if (!validateOrderBy(column, direction, "artist")) {
      console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
      column = "created_at";
      direction = "DESC";
    }

    const artists = await ArtistRepository.getMany({
      includeUser: includeUser === "true",
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
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

// GET /api/artists/:id/songs
router.get("/:id/songs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      includeAlbums,
      includeArtists,
      includeLikes,
      includeComments,
      orderByColumn,
      orderByDirection,
      limit,
      offset,
    } = req.query;
    if (!id) {
      res.status(400).json({ error: "Artist ID is required" });
      return;
    }

    let column = (orderByColumn as string) || "created_at";
    let direction = (orderByDirection as string) || "DESC";

    if (!validateOrderBy(column, direction, "song")) {
      console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
      column = "created_at";
      direction = "DESC";
    }

    const songs = await ArtistRepository.getSongs(id, {
      includeArtists: includeArtists === "true",
      includeAlbums: includeAlbums === "true",
      includeLikes: includeLikes === "true",
      includeComments: includeComments === "true",
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(songs);
  } catch (error) {
    console.error("Error in GET /artists/:id/songs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/artists/:id/albums
router.get(
  "/:id/albums",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        includeLikes,
        includeRuntime,
        includeSongCount,
        orderByColumn,
        orderByDirection,
        limit,
        offset,
      } = req.query;

      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      let column = (orderByColumn as string) || "created_at";
      let direction = (orderByDirection as string) || "DESC";

      if (!validateOrderBy(column, direction, "album")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "created_at";
        direction = "DESC";
      }

      const albums = await ArtistRepository.getAlbums(id, {
        includeLikes: includeLikes === "true",
        includeRuntime: includeRuntime === "true",
        includeSongCount: includeSongCount === "true",
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(albums);
    } catch (error) {
      console.error("Error in GET /artists/:id/albums:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/artists/:id/related
router.get(
  "/:id/related",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { includeUser, limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const relatedArtists = await ArtistRepository.getRelatedArtists(id, {
        includeUser: includeUser === "true",
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(relatedArtists);
    } catch (error) {
      console.error("Error in GET /artists/:id/related:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
