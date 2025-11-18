import express, { Request, Response } from "express";
import { requireAuth, requireRole } from "@middleware";
import { ReportService } from "@services";

const router = express.Router();

// POST /api/reports — create a new report (authenticated users only)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const reporterId = req.user?.id;
    const { reportedEntityId, reportedEntityType, reason, description } = req.body;

    if (!reporterId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!reportedEntityId || !reportedEntityType || !reason || !description) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Call service — service will validate values and delegate to repository
    const created = await ReportService.createReport({
      reporterId,
      reportedEntityId,
      reportedEntityType,
      reason,
      description,
    });

    // Repository/service may return a QueryResult-like object or the created row.
    // Normalize safely without assuming specific shapes.
    let payload: any = created;
    try {
      if (created && typeof created === "object") {
        if (Array.isArray((created as any).rows)) {
          payload = (created as any).rows[0];
        } else if (Array.isArray(created)) {
          payload = created[0];
        }
      }
    } catch (e) {
      // fall back to raw created
      payload = created;
    }

    res.status(201).json(payload);
  } catch (error: any) {
    console.error("Error in POST /api/reports:", error);
    const message = error?.message || "Internal server error";
    res.status(500).json({ error: message });
  }
});

// (Optional) GET /api/reports — admin listing of reports
router.get("/", requireAuth, requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    // Basic listing — delegate to repository/service if an implementation exists.
    // For now return a simple not-implemented response so admins know it's available.
    res.status(200).json({ message: "Reports listing endpoint — implement as needed" });
  } catch (error: any) {
    console.error("Error in GET /api/reports:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

export default router;
