import express, { Request, Response } from "express";
import { ReportService } from "@services";
import { handlePgError } from "@util";
import { authenticateToken } from "@middleware";

const router = express.Router();

/* ========================================================================== */
/*                              Report Routes                                 */
/* ========================================================================== */

// POST /api/report/song
router.post("/song", authenticateToken, async (req: Request, res: Response) => {
  const { reporter_id, reported_id, report_type, description } = req.body;

  if (!reporter_id || !reported_id || !report_type || !description) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  try {
    await ReportService.reportSong({
      reporter_id,
      reported_id,
      report_type,
      description,
    });
    res.status(201).json({ message: "Report submitted successfully." });
  } catch (error: any) {
    console.error("Report submission failed:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// POST /api/report/album
router.post(
  "/album",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { reporter_id, reported_id, report_type, description } = req.body;

    if (!reporter_id || !reported_id || !report_type || !description) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    try {
      await ReportService.reportAlbum({
        reporter_id,
        reported_id,
        report_type,
        description,
      });
      res.status(201).json({ message: "Report submitted successfully." });
    } catch (error: any) {
      console.error("Report submission failed:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/report/playlist
router.post(
  "/playlist",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { reporter_id, reported_id, report_type, description } = req.body;

    if (!reporter_id || !reported_id || !report_type || !description) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    try {
      await ReportService.reportPlaylist({
        reporter_id,
        reported_id,
        report_type,
        description,
      });
      res.status(201).json({ message: "Report submitted successfully." });
    } catch (error: any) {
      console.error("Report submission failed:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/report/user
router.post("/user", authenticateToken, async (req: Request, res: Response) => {
  const { reporter_id, reported_id, report_type, description } = req.body;

  if (!reporter_id || !reported_id || !report_type || !description) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  try {
    await ReportService.reportUser({
      reporter_id,
      reported_id,
      report_type,
      description,
    });
    res.status(201).json({ message: "Report submitted successfully." });
  } catch (error: any) {
    console.error("Report submission failed:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// POST /api/report/artist
router.post(
  "/artist",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { reporter_id, reported_id, report_type, description } = req.body;

    if (!reporter_id || !reported_id || !report_type || !description) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    try {
      await ReportService.reportArtist({
        reporter_id,
        reported_id,
        report_type,
        description,
      });
      res.status(201).json({ message: "Report submitted successfully." });
    } catch (error: any) {
      console.error("Report submission failed:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

export default router;
