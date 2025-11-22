import express, { Request, Response } from "express";
import { AdminService } from "@services";
import { validateOrderBy } from "@validators";
import { handlePgError, parseAccessContext, getCoverGradient } from "@util";

const router = express.Router();

// GET /api/admin/featured-playlist
router.get("/featured-playlist", async (req: Request, res: Response) => {
  try {
    const accessContext = parseAccessContext(req);
    const featuredPlaylist = await AdminService.getFeaturedPlaylist(
      accessContext
    );

    if (!featuredPlaylist) {
      res.status(404).json({ message: "Featured playlist not found" });
      return;
    }

    res.json(featuredPlaylist);
  } catch (error: any) {
    console.error("Error in GET /admin/featured-playlist:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/admin/:entityType/:entityId/cover-gradient
router.get(
  "/:entityType/:entityId/cover-gradient",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { entityType, entityId } = req.params;
      if (!entityId || !entityType) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      if (
        !(
          entityType === "song" ||
          entityType === "playlist" ||
          entityType === "album"
        )
      ) {
        res.status(400).json({ error: "Invalid entity type" });
        return;
      }

      const imageUrl = await AdminService.getEntityImageUrl(
        entityId,
        entityType
      );
      if (!imageUrl) {
        res.status(200).json({
          color1: { r: 8, g: 8, b: 8 },
          color2: { r: 213, g: 49, b: 49 },
        });
        return;
      }

      const gradient = await getCoverGradient(imageUrl);
      res.status(200).json(gradient);
    } catch (error: any) {
      console.error(
        "Error in GET /admin/:entityType/:entityId/cover-gradient:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// GET /api/admin/users/:userId/new-from-followed-artists
router.get(
  "/users/:userId/new-from-followed-artists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: "Missing userId parameter" });
        return;
      }

      const accessContext = parseAccessContext(req);

      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 10;

      const songs = await AdminService.getNewFromFollowedArtists(
        userId,
        accessContext,
        limit
      );

      res.status(200).json(songs);
    } catch (error: any) {}
  }
);

// GET /api/admin/top-artist
router.get("/top-artist", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 30;

    const topArtist = await AdminService.getTopArtist(days);

    if (!topArtist) {
      res.status(404).json({ message: "Top artist not found" });
      return;
    }

    res.status(200).json(topArtist);
  } catch (error) {
    console.error("Error in GET /admin/top-artist:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/admin/trending-songs
router.get("/trending-songs", async (req: Request, res: Response) => {
  try {
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

    let column = (orderByColumn as string) || "created_at";
    let direction = (orderByDirection as string) || "DESC";
    if (!validateOrderBy(column, direction, "song")) {
      console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
      column = "created_at";
      direction = "DESC";
    }

    const accessContext = parseAccessContext(req.query);

    const trendingSongs = await AdminService.getTrendingSongs(accessContext, {
      includeAlbums: includeAlbums === "true",
      includeArtists: includeArtists === "true",
      includeLikes: includeLikes === "true",
      includeComments: includeComments === "true",
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(trendingSongs);
  } catch (error) {
    console.error("Error in GET /admin/trending-songs:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

export default router;
