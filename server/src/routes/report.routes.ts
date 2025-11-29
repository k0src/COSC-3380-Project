import express, { Request, Response } from "express";
import { ReportService } from "@services";
import { handlePgError } from "@util";
import { validateOrderBy } from "@validators";
import { authenticateToken, requireAdmin } from "@middleware";

const router = express.Router();

// GET /api/report
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { orderByColumn, orderByDirection, limit, offset } = req.query;

    let column = (orderByColumn as string) || "reported_at";
    let direction = (orderByDirection as string) || "DESC";

    if (!validateOrderBy(column, direction, "report")) {
      console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
      column = "reported_at";
      direction = "DESC";
    }

    const reports = await ReportService.getReports({
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error in /report:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/report/appeal
router.get(
  "/appeal",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { orderByColumn, orderByDirection, limit, offset } = req.query;

      let column = (orderByColumn as string) || "submitted_at";
      let direction = (orderByDirection as string) || "DESC";

      if (!validateOrderBy(column, direction, "appeal")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "submitted_at";
        direction = "DESC";
      }

      const reports = await ReportService.getAppeals({
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(reports);
    } catch (error) {
      console.error("Error in /report/appeal:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/report/appeal/song
router.get(
  "/appeal/song",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { entityId, orderByColumn, orderByDirection, limit, offset } =
        req.query;
      if (!entityId) {
        res.status(400).json({ error: "Missing required parameters." });
        return;
      }

      let column = (orderByColumn as string) || "submitted_at";
      let direction = (orderByDirection as string) || "DESC";

      if (!validateOrderBy(column, direction, "appeal")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "submitted_at";
        direction = "DESC";
      }

      const reports = await ReportService.getSongAppeals(entityId as string, {
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(reports);
    } catch (error) {
      console.error("Error in /report/appeal/song:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/report/appeal/playlist
router.get(
  "/appeal/playlist",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { entityId, orderByColumn, orderByDirection, limit, offset } =
        req.query;
      if (!entityId) {
        res.status(400).json({ error: "Missing required parameters." });
        return;
      }

      let column = (orderByColumn as string) || "submitted_at";
      let direction = (orderByDirection as string) || "DESC";

      if (!validateOrderBy(column, direction, "appeal")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "submitted_at";
        direction = "DESC";
      }

      const reports = await ReportService.getPlaylistAppeals(
        entityId as string,
        {
          orderByColumn: column as any,
          orderByDirection: direction as any,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        }
      );

      res.status(200).json(reports);
    } catch (error) {
      console.error("Error in /report/appeal/playlist:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/report/appeal/album
router.get(
  "/appeal/album",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { entityId, orderByColumn, orderByDirection, limit, offset } =
        req.query;
      if (!entityId) {
        res.status(400).json({ error: "Missing required parameters." });
        return;
      }

      let column = (orderByColumn as string) || "submitted_at";
      let direction = (orderByDirection as string) || "DESC";

      if (!validateOrderBy(column, direction, "appeal")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "submitted_at";
        direction = "DESC";
      }

      const reports = await ReportService.getAlbumAppeals(entityId as string, {
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(reports);
    } catch (error) {
      console.error("Error in /report/appeal/playlist:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/report/appeal/user
router.get(
  "/appeal/user",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { entityId, orderByColumn, orderByDirection, limit, offset } =
        req.query;
      if (!entityId) {
        res.status(400).json({ error: "Missing required parameters." });
        return;
      }

      let column = (orderByColumn as string) || "submitted_at";
      let direction = (orderByDirection as string) || "DESC";

      if (!validateOrderBy(column, direction, "appeal")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "submitted_at";
        direction = "DESC";
      }

      const reports = await ReportService.getUserAppeals(entityId as string, {
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(reports);
    } catch (error) {
      console.error("Error in /report/appeal/user:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/report/song
router.post("/song", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reporter_id, reported_id, report_type, description } = req.body;

    if (!reporter_id || !reported_id || !report_type || !description) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    await ReportService.reportSong({
      reporter_id,
      reported_id,
      report_type,
      description,
    });
    res.status(201).json({ message: "Report submitted successfully." });
  } catch (error: any) {
    console.error("Error in /report/song:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// POST /api/report/playlist
router.post(
  "/playlist",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { reporter_id, reported_id, report_type, description } = req.body;
      if (!reporter_id || !reported_id || !report_type || !description) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      await ReportService.reportPlaylist({
        reporter_id,
        reported_id,
        report_type,
        description,
      });
      res.status(201).json({ message: "Report submitted successfully." });
    } catch (error: any) {
      console.error("Error in /report/playlist:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/report/album
router.post(
  "/album",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { reporter_id, reported_id, report_type, description } = req.body;
      if (!reporter_id || !reported_id || !report_type || !description) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      await ReportService.reportAlbum({
        reporter_id,
        reported_id,
        report_type,
        description,
      });
      res.status(201).json({ message: "Report submitted successfully." });
    } catch (error: any) {
      console.error("Error in /report/album:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/report/user
router.post("/user", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reporter_id, reported_id, report_type, description } = req.body;
    if (!reporter_id || !reported_id || !report_type || !description) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    await ReportService.reportUser({
      reporter_id,
      reported_id,
      report_type,
      description,
    });
    res.status(201).json({ message: "Report submitted successfully." });
  } catch (error: any) {
    console.error("Error in /report/user:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// POST /api/report/appeal/song
router.post(
  "/appeal/song",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId, reason, entityId } = req.body;
      console.log(userId, reason, entityId);
      if (!userId || !reason! || !entityId) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      await ReportService.appealSong({
        userId,
        reason,
        songId: entityId,
      });
      res.status(201).json({ message: "Appeal submitted successfully." });
    } catch (error: any) {
      console.error("Error in /report/appeal/song:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/report/appeal/song/check
router.get(
  "/appeal/song/check",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId, entityId } = req.query;
      if (!userId || !entityId) {
        res.status(400).json({ error: "Missing required parameters." });
        return;
      }

      const hasPendingAppeal = await ReportService.checkPendingAppeal(
        "song",
        userId as string,
        entityId as string
      );
      res.status(200).json({ hasPendingAppeal });
    } catch (error: any) {
      console.error("Error in /report/appeal/song/check:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/report/appeal/playlist
router.post(
  "/appeal/playlist",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId, reason, entityId } = req.body;
      if (!userId || !reason! || !entityId) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      await ReportService.appealPlaylist({
        userId,
        reason,
        playlistId: entityId,
      });
      res.status(201).json({ message: "Appeal submitted successfully." });
    } catch (error: any) {
      console.error("Error in /report/appeal/playlist:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/report/appeal/playlist/check
router.get(
  "/appeal/playlist/check",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId, entityId } = req.query;
      if (!userId || !entityId) {
        res.status(400).json({ error: "Missing required parameters." });
        return;
      }

      const hasPendingAppeal = await ReportService.checkPendingAppeal(
        "playlist",
        userId as string,
        entityId as string
      );
      res.status(200).json({ hasPendingAppeal });
    } catch (error: any) {
      console.error("Error in /report/appeal/playlist/check:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/report/appeal/album
router.post(
  "/appeal/album",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId, reason, entityId } = req.body;
      if (!userId || !reason! || !entityId) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      await ReportService.appealAlbum({
        userId,
        reason,
        albumId: entityId,
      });
      res.status(201).json({ message: "Appeal submitted successfully." });
    } catch (error: any) {
      console.error("Error in /report/appeal/album:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/report/appeal/album/check
router.get(
  "/appeal/album/check",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId, entityId } = req.query;
      if (!userId || !entityId) {
        res.status(400).json({ error: "Missing required parameters." });
        return;
      }

      const hasPendingAppeal = await ReportService.checkPendingAppeal(
        "album",
        userId as string,
        entityId as string
      );
      res.status(200).json({ hasPendingAppeal });
    } catch (error: any) {
      console.error("Error in /report/appeal/album/check:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/report/appeal/user
router.post(
  "/appeal/user",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId, reason } = req.body;
      if (!userId || !reason) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      await ReportService.appealUser({
        userId,
        reason,
      });
      res.status(201).json({ message: "Appeal submitted successfully." });
    } catch (error: any) {
      console.error("Error in /report/appeal/user:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/report/appeal/user/check
router.get(
  "/appeal/user/check",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId, entityId } = req.query;
      if (!userId || !entityId) {
        res.status(400).json({ error: "Missing required parameters." });
        return;
      }

      const hasPendingAppeal = await ReportService.checkPendingAppeal(
        "user",
        userId as string
      );
      res.status(200).json({ hasPendingAppeal });
    } catch (error: any) {
      console.error("Error in /report/appeal/user/check:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/report/:reportId/resolve
router.post(
  "/:reportId/resolve",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { entityType, reviewerId, entityId } = req.body;
      if (!reportId || !entityType || !reviewerId) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      await ReportService.resolveReport(
        reportId,
        entityType,
        reviewerId,
        entityId
      );
      res.status(200).json({ message: "Report resolved successfully." });
    } catch (error: any) {
      console.error("Error in /report/:reportId/resolve:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/report/:reportId/dismiss
router.post(
  "/:reportId/dismiss",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { entityType, reviewerId, entityId } = req.body;
      if (!reportId || !entityType || !reviewerId) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      await ReportService.dismissReport(
        reportId,
        entityType,
        reviewerId,
        entityId
      );
      res.status(200).json({ message: "Report dismissed successfully." });
    } catch (error: any) {
      console.error("Error in /report/:reportId/dismiss:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/report/appeal/:appealId/resolve
router.post(
  "/appeal/:appealId/resolve",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { appealId } = req.params;
      const { entityType, reviewerId, entityId } = req.body;
      if (!appealId || !entityType || !reviewerId) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      await ReportService.resolveAppeal(entityType, reviewerId, entityId);

      res.status(200).json({ message: "Appeal resolved successfully." });
    } catch (error: any) {
      console.error("Error in /report/appeal/:appealId/resolve:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/report/appeal/:appealId/dismiss
router.post(
  "/appeal/:appealId/dismiss",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { appealId } = req.params;
      const { entityType, reviewerId } = req.body;
      if (!appealId || !entityType || !reviewerId) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      await ReportService.dismissAppeal(appealId, entityType, reviewerId);

      res.status(200).json({ message: "Appeal dismissed successfully." });
    } catch (error: any) {
      console.error("Error in /report/appeal/:appealId/dismiss:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

export default router;
