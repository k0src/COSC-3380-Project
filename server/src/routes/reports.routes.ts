import express from "express";
import { ReportService } from "@services";
import type { UUID } from "../types";

const router = express.Router();

/**
 * POST /api/reports
 * Create a new report
 */
router.post("/", async (req, res) => {
  try {
    // Basic validation of required fields
    const { reporterId, reportedEntityId, reportedEntityType, reason, description } = req.body;
    
    if (!reporterId || !reportedEntityId || !reportedEntityType || !reason || !description) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: reporterId, reportedEntityId, reportedEntityType, reason, description" 
      });
    }

    const reportData = {
      reporterId: reporterId as UUID,
      reportedEntityId: reportedEntityId as UUID,
      reportedEntityType: reportedEntityType as "SONG" | "ARTIST" | "ALBUM" | "PLAYLIST",
      reason: reason as "EXPLICIT" | "VIOLENT" | "HATEFUL" | "COPYRIGHT",
      description: description as string,
    };

    const report = await ReportService.createReport(reportData);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error("Error creating report:", error);

    // Handle different types of errors
    if (error instanceof Error) {
      // Validation errors from service
      if (error.message.includes("Invalid") || error.message.includes("Missing")) {
        return res.status(400).json({ success: false, message: error.message });
      }
      
      // Database constraint errors
      if (error.message.includes("violates")) {
        return res.status(409).json({ success: false, message: "Report already exists or conflicts with existing data" });
      }
    }

    // Generic server error
    res.status(500).json({ 
      success: false, 
      message: "An unexpected error occurred while creating the report" 
    });
  }
});

export default router;