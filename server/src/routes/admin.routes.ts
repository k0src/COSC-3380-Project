import express, { Request, Response } from "express";
import { AdminService } from "@services";
import { UserRepository } from "@repositories";
import { parseForm } from "@infra/form-parser";
import { validateOrderBy } from "@validators";
import { handlePgError, parseAccessContext, getCoverGradient } from "@util";

const router = express.Router();

// GET /api/admin/dashboard/stats
router.get("/dashboard/stats", async (req: Request, res: Response) => {
  try {
    const stats = await AdminService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    console.error("Error in GET /admin/dashboard/stats:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/admin/dashboard/user-growth
router.get("/dashboard/user-growth", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const userGrowth = await AdminService.getUserGrowth(days);
    res.json(userGrowth);
  } catch (error: any) {
    console.error("Error in GET /admin/dashboard/user-growth:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/admin/dashboard/top-artists
router.get("/dashboard/top-artists", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const topArtists = await AdminService.getTopArtists(limit);
    res.json(topArtists);
  } catch (error: any) {
    console.error("Error in GET /admin/dashboard/top-artists:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/admin/dashboard/platform-activity
router.get(
  "/dashboard/platform-activity",
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const platformActivity = await AdminService.getPlatformActivity(days);
      res.json(platformActivity);
    } catch (error: any) {
      console.error("Error in GET /admin/dashboard/platform-activity:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// GET /api/admin/dashboard/recent-reports
router.get("/dashboard/recent-reports", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const recentReports = await AdminService.getRecentReports(limit, offset);
    res.json(recentReports);
  } catch (error: any) {
    console.error("Error in GET /admin/dashboard/recent-reports:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/admin/users
router.get("/users", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const users = await AdminService.getAllUsers(limit, offset);
    res.json(users);
  } catch (error: any) {
    console.error("Error in GET /admin/users:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// PUT /api/admin/users/:userId/update
router.put(
  "/users/:userId/update",
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
    }
  }
);

// POST /api/admin/users/:userId/suspend
router.post("/users/:userId/suspend", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const user = await AdminService.suspendUser(userId);
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
});

// POST /api/admin/users/:userId/deactivate
router.post(
  "/users/:userId/deactivate",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const user = await AdminService.deactivateUser(userId);
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

// POST /api/admin/users/:userId/reactivate
router.post(
  "/users/:userId/reactivate",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const user = await AdminService.reactivateUser(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error: any) {
      console.error("Error in POST /admin/users/:userId/reactivate:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

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

export default router;
