import express, { Request, Response } from "express";
import { AdminService } from "@services";
import { ArtistRepository, UserRepository } from "@repositories";
import { parseForm } from "@infra/form-parser";
import { validateOrderBy } from "@validators";
import { handlePgError, getCoverGradient } from "@util";
import { authenticateToken, requireAdmin } from "@middleware";

const router = express.Router();

// GET /api/admin/users
router.get(
  "/users",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { orderByColumn, orderByDirection, limit, offset } = req.query;

      let column = (orderByColumn as string) || "created_at";
      let direction = (orderByDirection as string) || "DESC";
      if (!validateOrderBy(column, direction, "user")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "created_at";
        direction = "DESC";
      }

      const users = await AdminService.getUsersInfo({
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.json(users);
    } catch (error: any) {
      console.error("Error in GET /admin/users:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// PUT /api/admin/users/:userId/update
router.put(
  "/users/:userId/update",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }
      const updateData = await parseForm(req, "user");
      const updatedUser = await UserRepository.update(userId, updateData);

      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json(updatedUser);
    } catch (error: any) {
      console.error("Error in PUT /users/:id:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/admin/users/:userId/suspend
router.post(
  "/users/:userId/suspend",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const user = await UserRepository.update(userId, { status: "SUSPENDED" });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error: any) {
      console.error("Error in POST /admin/users/:userId/suspend:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/admin/users/:userId/deactivate
router.post(
  "/users/:userId/deactivate",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const user = await UserRepository.update(userId, {
        status: "DEACTIVATED",
      });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error: any) {
      console.error("Error in POST /admin/users/:userId/deactivate:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/admin/artists/:artistId/verify
router.post(
  "/artists/:artistId/verify",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { artistId } = req.params;
      const { userId } = req.body;
      if (!artistId || !userId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const artist = await ArtistRepository.update(artistId, {
        user_id: userId,
        verified: true,
      });
      if (!artist) {
        res.status(404).json({ error: "Artist not found" });
        return;
      }
      res.json(artist);
    } catch (error: any) {
      console.error("Error in POST /admin/artists/:artistId/verify:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/admin/artists/:artistId/unverify
router.post(
  "/artists/:artistId/unverify",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { artistId } = req.params;
      const { userId } = req.body;
      if (!artistId || !userId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const artist = await ArtistRepository.update(artistId, {
        user_id: userId,
        verified: false,
      });
      if (!artist) {
        res.status(404).json({ error: "Artist not found" });
        return;
      }
      res.json(artist);
    } catch (error: any) {
      console.error("Error in POST /admin/artists/:artistId/unverify:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/admin/featured-playlist
router.get(
  "/featured-playlist",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const featuredPlaylist = await AdminService.getFeaturedPlaylist();
      if (!featuredPlaylist) {
        res.status(404).json({ message: "Featured playlist not found" });
        return;
      }

      res.json(featuredPlaylist);
    } catch (error: any) {
      console.error("Error in GET /admin/featured-playlist:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/admin/featured-playlist
router.post(
  "/featured-playlist",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { playlistId } = req.body;
      if (!playlistId) {
        res.status(400).json({ error: "Playlist ID is required" });
        return;
      }

      const result = await AdminService.setFeaturedPlaylist(playlistId);
      res.json(result);
    } catch (error: any) {
      console.error("Error in POST /admin/featured-playlist:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

//indivudual routes
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
      return;
    }
  }
);

export default router;
