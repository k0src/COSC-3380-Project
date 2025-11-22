import express, { Request, Response } from "express";
import { StatsService } from "@services";
import { handlePgError } from "@util";

const router = express.Router();

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
    }
  }
);

// GET /api/stats/artists/:artistId/top-song
router.get(
  "/artists/:artistId/top-song",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { days } = req.query;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;
      const topSong = await StatsService.getArtistTopSong(artistId, daysNum);
      res.status(200).json(topSong);
    } catch (error: any) {
      console.error("Error in GET /stats/artists/:artistId/top-song:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
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
    }
  }
);

// GET /api/stats/artists/:artistId/top-songs
router.get(
  "/artists/:artistId/top-songs",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { days, limit } = req.query;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;
      const limitNum = limit ? parseInt(limit as string, 10) : 5;
      const topSongs = await StatsService.getArtistTopSongs(
        artistId,
        daysNum,
        limitNum
      );
      res.status(200).json(topSongs);
    } catch (error: any) {
      console.error("Error in GET /stats/artists/:artistId/top-songs:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// GET /api/stats/artists/:artistId/top-playlists
router.get(
  "/artists/:artistId/top-playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { days, limit } = req.query;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;
      const limitNum = limit ? parseInt(limit as string, 10) : 5;
      const topPlaylists = await StatsService.getArtistTopPlaylists(
        artistId,
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
    }
  }
);

// GET /api/stats/artists/:artistId/top-listeners
router.get(
  "/artists/:artistId/top-listeners",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { days, limit } = req.query;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const daysNum = days ? parseInt(days as string, 10) : 30;
      const limitNum = limit ? parseInt(limit as string, 10) : 5;
      const topListeners = await StatsService.getArtistTopListeners(
        artistId,
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
    }
  }
);

// GET /stats/artists/:artistId/recent-release
router.get(
  "/artists/:artistId/recent-release",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const recentRelease = await StatsService.getArtistRecentRelease(artistId);
      res.status(200).json(recentRelease);
    } catch (error: any) {
      console.error(
        "Error in GET /stats/artists/:artistId/recent-release:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// GET /api/stats/artists/:artistId/all-time
router.get(
  "/artists/:artistId/all-time",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const stats = await StatsService.getArtistAllTimeStats(artistId);
      res.status(200).json(stats);
    } catch (error: any) {
      console.error("Error in GET /stats/artists/:artistId/all-time:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
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
    }
  }
);

export default router;
