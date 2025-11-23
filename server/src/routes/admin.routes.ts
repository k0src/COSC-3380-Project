import express, { Request, Response } from "express";
import { AdminService, AdminReportService } from "@services";
import { validateOrderBy } from "@validators";
import { handlePgError, parseAccessContext, getCoverGradient } from "@util";

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
