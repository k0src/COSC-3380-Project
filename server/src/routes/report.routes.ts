import express, { Request, Response } from "express";
import { ReportService } from "@services";

const router = express.Router();

// POST /api/report/song
router.post("/song", async (req: Request, res: Response) => {
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
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// POST /api/report/album
router.post("/album", async (req: Request, res: Response) => {
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
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// POST /api/report/playlist
router.post("/playlist", async (req: Request, res: Response) => {
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
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// POST /api/report/user
router.post("/user", async (req: Request, res: Response) => {
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
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// POST /api/report/artist
router.post("/artist", async (req: Request, res: Response) => {
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
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

export default router;
