import express, { Request, Response } from "express";
import { StatsService, CommentService } from "@services";
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

export default router;
