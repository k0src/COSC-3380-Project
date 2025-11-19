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

//! move to comment routes
// GET /api/stats/artists/:artistId/comments
router.get(
  "/artists/:artistId/comments",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { limit, orderBy, orderDirection } = req.query;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 10;
      const comments = await CommentService.getCommentsByArtistId(
        artistId,
        limitNum,
        orderBy as string,
        orderDirection as string
      );
      res.status(200).json(comments);
    } catch (error: any) {
      console.error("Error in GET /stats/artists/:artistId/comments:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

export default router;
