import express, { Request, Response } from "express";
import { AlbumRepository } from "@repositories";
import { LikeService } from "@services";
import { handlePgError, parseAccessContext } from "@util";
import { parseForm } from "@infra/form-parser";
import { validateOrderBy } from "@validators";

const router = express.Router();

// GET /api/albums
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      includeArtist,
      includeRuntime,
      includeSongCount,
      includeLikes,
      orderByColumn,
      orderByDirection,
      limit,
      offset,
    } = req.query;

    let column = (orderByColumn as string) || "created_at";
    let direction = (orderByDirection as string) || "DESC";
    if (!validateOrderBy(column, direction, "album")) {
      console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
      column = "created_at";
      direction = "DESC";
    }

    const accessContext = parseAccessContext(req.query);

    const albums = await AlbumRepository.getMany(accessContext, {
      includeArtist: includeArtist === "true",
      includeRuntime: includeRuntime === "true",
      includeLikes: includeLikes === "true",
      includeSongCount: includeSongCount === "true",
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(albums);
  } catch (error: any) {
    console.error("Error in GET /albums/:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// GET /api/albums/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      includeArtist,
      includeRuntime,
      includeSongCount,
      includeLikes,
      includeSongIds,
    } = req.query;

    if (!id) {
      res.status(400).json({ error: "Album ID is required" });
      return;
    }

    const accessContext = parseAccessContext(req.query);

    const album = await AlbumRepository.getOne(id, accessContext, {
      includeArtist: includeArtist === "true",
      includeRuntime: includeRuntime === "true",
      includeLikes: includeLikes === "true",
      includeSongCount: includeSongCount === "true",
      includeSongIds: includeSongIds === "true",
    });

    if (!album) {
      res.status(404).json({ error: "Album not found" });
      return;
    }

    res.status(200).json(album);
  } catch (error: any) {
    console.error("Error in GET /albums/:id:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// POST /api/albums
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const albumData = await parseForm(req, "album");
    const newAlbum = await AlbumRepository.create(albumData);

    if (!newAlbum) {
      res.status(400).json({ error: "Failed to create album" });
      return;
    }

    res.status(200).json(newAlbum);
  } catch (error: any) {
    console.error("Error in POST /api/albums/:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// PUT /api/albums/:id
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Album ID is required!" });
      return;
    }

    const albumData = await parseForm(req, "album");
    const updatedAlbum = await AlbumRepository.update(id, albumData);

    if (!updatedAlbum) {
      res.status(404).json({ error: "Album not found" });
      return;
    }

    res.status(200).json(updatedAlbum);
  } catch (error: any) {
    console.error("Error in PUT /api/albums/:id:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// DELETE /api/albums/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Album ID is required!" });
      return;
    }

    const deleted = await AlbumRepository.delete(id);
    if (!deleted) {
      res.status(404).json({ error: "Album not found" });
      return;
    }

    res.status(200).json({ message: "Album deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/albums/:id:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/albums/:id/songs
router.get("/:id/songs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeArtists, includeLikes, limit, offset } = req.query;

    if (!id) {
      res.status(400).json({ error: "Album ID is required" });
      return;
    }

    const accessContext = parseAccessContext(req.query);

    const songs = await AlbumRepository.getSongs(id, accessContext, {
      includeArtists: includeArtists === "true",
      includeLikes: includeLikes === "true",
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(songs);
  } catch (error: any) {
    console.error("Error in GET /albums/:id/songs:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// GET /api/albums/:id/liked-by
router.get(
  "/:id/liked-by",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "Album ID is required!" });
        return;
      }

      const users = await LikeService.getUsersWhoLiked(id, "album", {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.status(200).json(users);
    } catch (error: any) {
      console.error("Error in GET /api/albums/:id/liked-by:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
      return;
    }
  }
);

// GET /api/albums/:id/related
router.get(
  "/:id/related",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        includeArtist,
        includeLikes,
        includeSongCount,
        includeRuntime,
        limit,
        offset,
      } = req.query;

      if (!id) {
        res.status(400).json({ error: "Album ID is required" });
        return;
      }

      const albums = await AlbumRepository.getRelatedAlbums(id, {
        includeArtist: includeArtist === "true",
        includeLikes: includeLikes === "true",
        includeSongCount: includeSongCount === "true",
        includeRuntime: includeRuntime === "true",
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(albums);
    } catch (error: any) {
      console.error("Error in GET /albums/:id/related:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
      return;
    }
  }
);

export default router;
