import express, { Request, Response } from "express";
import { PlaylistRepository } from "@repositories";
import { generatePlaylistImage } from "@util/playlistImage.util";
import { LikeService } from "@services";

const router = express.Router();

// GET /api/playlists
// Example:
// /api/playlists?includeUser=true&includeLikes=true&includeSongCount=true&limit=50&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      includeUser,
      includeLikes,
      includeSongCount,
      includeRuntime,
      limit,
      offset,
    } = req.query;

    const playlists = await PlaylistRepository.getMany({
      includeUser: includeUser === "true",
      includeLikes: includeLikes === "true",
      includeSongCount: includeSongCount === "true",
      includeRuntime: includeRuntime === "true",
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
  const { includeUser, includeLikes, includeSongCount, includeRuntime } =
    req.query;

  if (!id) {
    res.status(400).json({ error: "Playlist ID is required" });
    return;
  }

  try {
    const playlist = await PlaylistRepository.getOne(id, {
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
  } catch (error) {
    console.error("Error in GET /playlists/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/playlists/:id/songs
// Example:
// /api/playlists/:id/songs?includeAlbums=true&includeArtisst=true&includeLikes=true&limit=50&offset=0
router.get("/:id/songs", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { includeAlbums, includeArtists, includeLikes, limit, offset } =
    req.query;

  if (!id) {
    res.status(400).json({ error: "Playlist ID is required" });
    return;
  }

  try {
    const songs = await PlaylistRepository.getSongs(id, {
      includeAlbums: includeAlbums === "true",
      includeArtists: includeArtists === "true",
      includeLikes: includeLikes === "true",
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(songs);
  } catch (error) {
    console.error("Error in GET /playlists/:id/songs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
    } catch (error) {
      console.error("Error in GET /playlists/:id/cover-image:", error);
      res.status(204).send();
    }
  },
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
    } catch (error) {
      console.error("Error in GET /api/playlists/:id/liked-by:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
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
    } catch (error) {
      console.error("Error in GET /playlists/:id/related:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// POST /api/playlists/:id/remix
router.post(
  "/:id/remix",
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
        numberOfSongs,
      );

      res.status(200).json({ remixPlaylistId });
    } catch (error) {
      console.error("Error in POST /playlists/:id/remix:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
