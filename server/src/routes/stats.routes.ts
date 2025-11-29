import express, { Request, Response } from "express";
import { StatsService } from "@services";
import { handlePgError } from "@util";
import { authenticateToken, requireAdmin } from "@middleware";

const router = express.Router();

/* ============================= Admin Dashboard ============================ */

// GET /api/stats/admin/dashboard/stats
router.get(
  "/admin/dashboard/stats",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const stats = await StatsService.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error in GET /admin/dashboard/stats:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/admin/dashboard/user-growth
router.get(
  "/admin/dashboard/user-growth",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const userGrowth = await StatsService.getUserGrowth(days);
      res.json(userGrowth);
    } catch (error: any) {
      console.error("Error in GET /admin/dashboard/user-growth:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/admin/dashboard/top-artists
router.get(
  "/admin/dashboard/top-artists",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topArtists = await StatsService.getTopArtists(limit);
      res.json(topArtists);
    } catch (error: any) {
      console.error("Error in GET /admin/dashboard/top-artists:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/admin/dashboard/platform-activity
router.get(
  "/admin/dashboard/platform-activity",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const platformActivity = await StatsService.getPlatformActivity(days);
      res.json(platformActivity);
    } catch (error: any) {
      console.error("Error in GET /admin/dashboard/platform-activity:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

/* ============================== Artist Stats ============================== */

// GET /api/stats/artists/:artistId/quick
router.get(
  "/artists/:artistId/quick",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { days } = req.query;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;
      const stats = await StatsService.getArtistQuickStats(artistId, daysNum);
      res.status(200).json(stats);
    } catch (error: any) {
      console.error("Error in GET /stats/artists/:artistId/quick:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/artists/:artistId/top-song
router.get(
  "/artists/:artistId/top-song",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { userId, days } = req.query;

      if (!artistId || !userId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;
      const topSong = await StatsService.getArtistTopSong(
        artistId,
        userId as string,
        daysNum
      );
      res.status(200).json(topSong);
    } catch (error: any) {
      console.error("Error in GET /stats/artists/:artistId/top-song:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/artists/:artistId/daily-streams
router.get(
  "/artists/:artistId/daily-streams",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { days } = req.query;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;
      const streams = await StatsService.getArtistDailyStreams(
        artistId,
        daysNum
      );
      res.status(200).json(streams);
    } catch (error: any) {
      console.error(
        "Error in GET /stats/artists/:artistId/daily-streams:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/artists/:artistId/top-songs
router.get(
  "/artists/:artistId/top-songs",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { userId, days, limit } = req.query;
      if (!artistId || !userId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;
      const limitNum = limit ? parseInt(limit as string, 10) : 5;
      const topSongs = await StatsService.getArtistTopSongs(
        artistId,
        userId as string,
        daysNum,
        limitNum
      );
      res.status(200).json(topSongs);
    } catch (error: any) {
      console.error("Error in GET /stats/artists/:artistId/top-songs:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/artists/:artistId/top-playlists
router.get(
  "/artists/:artistId/top-playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { userId, days, limit } = req.query;
      if (!artistId || !userId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;
      const limitNum = limit ? parseInt(limit as string, 10) : 5;
      const topPlaylists = await StatsService.getArtistTopPlaylists(
        artistId,
        userId as string,
        daysNum,
        limitNum
      );
      res.status(200).json(topPlaylists);
    } catch (error: any) {
      console.error(
        "Error in GET /stats/artists/:artistId/top-playlists:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/artists/:artistId/top-listeners
router.get(
  "/artists/:artistId/top-listeners",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { userId, days, limit } = req.query;
      if (!artistId || !userId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;
      const limitNum = limit ? parseInt(limit as string, 10) : 5;
      const topListeners = await StatsService.getArtistTopListeners(
        artistId,
        userId as string,
        daysNum,
        limitNum
      );
      res.status(200).json(topListeners);
    } catch (error: any) {
      console.error(
        "Error in GET /stats/artists/:artistId/top-listeners:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /stats/artists/:artistId/recent-release
router.get(
  "/artists/:artistId/recent-release",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { userId } = req.query;
      if (!artistId || !userId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const recentRelease = await StatsService.getArtistRecentRelease(
        artistId,
        userId as string
      );
      res.status(200).json(recentRelease);
    } catch (error: any) {
      console.error(
        "Error in GET /stats/artists/:artistId/recent-release:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/artists/:artistId/all-time
router.get(
  "/artists/:artistId/all-time",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { userId } = req.query;
      if (!artistId || !userId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const stats = await StatsService.getArtistAllTimeStats(
        artistId,
        userId as string
      );
      res.status(200).json(stats);
    } catch (error: any) {
      console.error("Error in GET /stats/artists/:artistId/all-time:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/artists/:artistId/streams-bar-chart
router.get(
  "/artists/:artistId/streams-bar-chart",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { timeRange } = req.query;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const timeRangeStr = (timeRange as string) || "30d";
      const chartData = await StatsService.getArtistStreamsBarChartData(
        artistId,
        timeRangeStr
      );
      res.status(200).json(chartData);
    } catch (error: any) {
      console.error(
        "Error in GET /stats/artists/:artistId/streams-bar-chart:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/artists/:artistId/listeners-pie-chart
router.get(
  "/artists/:artistId/listeners-pie-chart",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const pieData = await StatsService.getArtistListenersPieChartData(
        artistId
      );
      res.status(200).json(pieData);
    } catch (error: any) {
      console.error(
        "Error in GET /stats/artists/:artistId/listeners-pie-chart:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/stats/artists/:artistId/followers-data
router.get(
  "/artists/:artistId/followers-data",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }
      const followersData = await StatsService.getArtistFollowersData(artistId);
      res.status(200).json(followersData);
    } catch (error: any) {
      console.error(
        "Error in GET /stats/artists/:artistId/followers-data:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

export default router;
