import express, { Request, Response } from "express";
import { PlaylistRepository } from "@repositories";
import {
  generatePlaylistImage,
  parseAccessContext,
  handlePgError,
} from "@util";
import { parseForm } from "@infra/form-parser";
import { LikeService } from "@services";
import { validateOrderBy } from "@validators";
import { authenticateToken } from "@middleware";

const router = express.Router();

/* ========================================================================== */
/*                                Main Routes                                 */
/* ========================================================================== */

// GET /api/playlists
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      includeUser,
      includeLikes,
      includeSongCount,
      includeRuntime,
      orderByColumn,
      orderByDirection,
      limit,
      offset,
    } = req.query;

    let column = (orderByColumn as string) || "created_at";
    let direction = (orderByDirection as string) || "DESC";
    if (!validateOrderBy(column, direction, "playlist")) {
      console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
      column = "created_at";
      direction = "DESC";
    }

    const accessContext = parseAccessContext(req.query);

    const playlists = await PlaylistRepository.getMany(accessContext, {
      includeUser: includeUser === "true",
      includeLikes: includeLikes === "true",
      includeSongCount: includeSongCount === "true",
      includeRuntime: includeRuntime === "true",
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(playlists);
  } catch (error: any) {
    console.error("Error in GET /playlists/:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/playlists/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeUser, includeLikes, includeSongCount, includeRuntime } =
      req.query;

    if (!id) {
      res.status(400).json({ error: "Playlist ID is required" });
      return;
    }

    const accessContext = parseAccessContext(req.query);

    const playlist = await PlaylistRepository.getOne(id, accessContext, {
      includeUser: includeUser === "true",
      includeLikes: includeLikes === "true",
      includeSongCount: includeSongCount === "true",
      includeRuntime: includeRuntime === "true",
    });

    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }

    res.status(200).json(playlist);
  } catch (error: any) {
    console.error("Error in GET /playlists/:id:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// POST /api/playlists
router.post(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const createData = await parseForm(req, "playlist");
      const newPlaylist = await PlaylistRepository.create(createData);
      if (!newPlaylist) {
        res.status(400).json({ error: "Failed to create playlist" });
        return;
      }
      res.status(200).json(newPlaylist);
    } catch (error: any) {
      console.error("Error in POST /playlists/:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// PUT /api/playlists/:id
router.put(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Playlist ID is required" });
        return;
      }

      const updateData = await parseForm(req, "playlist");
      const updatedPlaylist = await PlaylistRepository.update(id, updateData);

      if (!updatedPlaylist) {
        res.status(404).json({ error: "Playlist not found" });
        return;
      }

      res.status(200).json(updatedPlaylist);
    } catch (error: any) {
      console.error("Error in PUT /playlists/:id:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// DELETE /api/playlists/:id
router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Playlist ID is required" });
        return;
      }

      await PlaylistRepository.delete(id);
      res.status(200).json({ message: "Playlist deleted successfully" });
    } catch (error: any) {
      console.error("Error in DELETE /playlists/:id:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/playlists/bulk-delete
router.post(
  "/bulk-delete",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { playlistIds } = req.body;

      if (
        !playlistIds ||
        !Array.isArray(playlistIds) ||
        playlistIds.length === 0
      ) {
        res.status(400).json({ error: "Playlist IDs array is required" });
        return;
      }

      await PlaylistRepository.bulkDelete(playlistIds);
      res.status(200).json({
        message: `${playlistIds.length} playlist${
          playlistIds.length === 1 ? "" : "s"
        } deleted successfully`,
      });
    } catch (error: any) {
      console.error("Error in POST /playlists/bulk-delete:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

/* ========================================================================== */
/*                              Playlist Songs                                */
/* ========================================================================== */

// GET /api/playlists/:id/songs
router.get("/:id/songs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeAlbums, includeArtists, includeLikes, limit, offset } =
      req.query;

    if (!id) {
      res.status(400).json({ error: "Playlist ID is required" });
      return;
    }

    const accessContext = parseAccessContext(req.query);

    const songs = await PlaylistRepository.getSongs(id, accessContext, {
      includeAlbums: includeAlbums === "true",
      includeArtists: includeArtists === "true",
      includeLikes: includeLikes === "true",
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(songs);
  } catch (error: any) {
    console.error("Error in GET /playlists/:id/songs:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// PUT /api/playlists/:id/songs
router.put(
  "/:id/songs",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { songIds } = req.body;

      if (!id) {
        res.status(400).json({ error: "Playlist ID is required" });
        return;
      }

      if (!Array.isArray(songIds)) {
        res.status(400).json({ error: "songIds must be an array" });
        return;
      }

      await PlaylistRepository.addSongs(id, songIds);
      res.status(200).json({ message: "Songs added to playlist successfully" });
    } catch (error: any) {
      console.error("Error in PUT /playlists/:id/songs:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// PUT /api/playlists/:id/songs/remove
router.put(
  "/:id/songs/remove",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { songIds } = req.body;

      if (!id) {
        res.status(400).json({ error: "Playlist ID is required" });
        return;
      }

      if (!Array.isArray(songIds)) {
        res.status(400).json({ error: "songIds must be an array" });
        return;
      }

      await PlaylistRepository.removeSongs(id, songIds);
      res
        .status(200)
        .json({ message: "Songs removed from playlist successfully" });
    } catch (error: any) {
      console.error("Error in PUT /playlists/:id/songs/remove:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

/* ========================================================================== */
/*                         Playlist Likes & Related                           */
/* ========================================================================== */

// GET /api/playlists/:id/cover-image
router.get(
  "/:id/cover-image",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "Playlist ID is required" });
        return;
      }

      const songImageUrls = await PlaylistRepository.getCoverImageUrls(id, 4);
      if (songImageUrls.length === 0) {
        res.status(204).send();
        return;
      }

      const imageBuffer = await generatePlaylistImage({
        playlistId: id,
        songImageUrls,
        size: 640,
      });

      res.set({
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
        ETag: `"${id}-${songImageUrls.length}"`,
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });

      res.send(imageBuffer);
    } catch (error: any) {
      console.error("Error in GET /playlists/:id/cover-image:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// GET /api/playlists/:id/liked-by
router.get(
  "/:id/liked-by",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "Playlist ID is required!" });
        return;
      }

      const users = await LikeService.getUsersWhoLiked(id, "playlist", {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.status(200).json(users);
    } catch (error: any) {
      console.error("Error in GET /api/playlists/:id/liked-by:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// GET /api/playlists/:id/related
router.get(
  "/:id/related",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        includeUser,
        includeLikes,
        includeSongCount,
        includeRuntime,
        limit,
        offset,
      } = req.query;

      if (!id) {
        res.status(400).json({ error: "Playlist ID is required" });
        return;
      }

      const playlists = await PlaylistRepository.getRelatedPlaylists(id, {
        includeUser: includeUser === "true",
        includeLikes: includeLikes === "true",
        includeSongCount: includeSongCount === "true",
        includeRuntime: includeRuntime === "true",
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(playlists);
    } catch (error: any) {
      console.error("Error in GET /playlists/:id/related:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

/* ========================================================================== */
/*                            Playlist Operations                             */
/* ========================================================================== */

// POST /api/playlists/:id/remix
router.post(
  "/:id/remix",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, numberOfSongs } = req.body;

      if (!id) {
        res.status(400).json({ error: "Playlist ID is required" });
        return;
      }

      const remixPlaylistId = await PlaylistRepository.createRemixPlaylist(
        userId,
        id,
        numberOfSongs
      );

      res.status(200).json({ remixPlaylistId });
    } catch (error: any) {
      console.error("Error in POST /playlists/:id/remix:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

export default router;
