import express from "express";
import { AdminReportService } from "@services";

const router = express.Router();

/**
 * GET /api/admin/reports/:entity
 * Fetch all reports for a given entity type.
 */
router.get("/reports/:entity", async (req, res) => {
  try {
    const { entity } = req.params;
    const { limit, offset } = req.query;

    const reports = await AdminReportService.getReports(
      entity as "user" | "song" | "album" | "playlist",
      {
        limits: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      }
    );

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reports" });
  }
});

/**
 * POST /api/admin/reports/:entity/:reportId/decide
 * Update a report decision (suspend/reject)
 */
router.post("/reports/:entity/:reportId/decide", async (req, res) => {
  try {
    const { entity, reportId } = req.params;
    const { result, reviewer_id } = req.body;

    if (!result || !reviewer_id) {
      res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
      return;
    }

    const updated = await AdminReportService.decideReport(
      entity as "user" | "song" | "album" | "playlist",
      reportId,
      result,
      reviewer_id
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating report decision:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update report decision" });
  }
});

export default router;