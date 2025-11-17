import { Router, Request, Response, NextFunction } from "express";
import { AdminAppealsService } from "../services/index.js";
import type { UUID } from "../types/index.js";

const router = Router();

/**
 * @route GET /admin/appeals/:entity
 * @desc Get appeals for a specific entity type
 * @access Admin only (authorization handled upstream)
 */
router.get("/:entity", async (req: Request, res: Response): Promise<void> => {
  try {
    const entity = req.params.entity;
    
    if (!entity) {
      res.status(400).json({ message: "Entity parameter is required" });
      return;
    }
    
    // Validate entity type and map to correct format
    const entityMapping: Record<string, "user" | "song" | "album" | "playlist"> = {
      "users": "user",
      "songs": "song", 
      "albums": "album",
      "playlists": "playlist"
    };

    const mappedEntity = entityMapping[entity];
    if (!mappedEntity) {
      res.status(400).json({ 
        message: `Invalid entity type. Must be one of: ${Object.keys(entityMapping).join(", ")}` 
      });
      return;
    }

    const appeals = await AdminAppealsService.getAppeals(mappedEntity);
    
    res.json({
      success: true,
      data: appeals,
      message: `${entity} appeals retrieved successfully`
    });
  } catch (error) {
    console.error("Error getting appeals:", error);
    res.status(500).json({ 
      message: "Failed to retrieve appeals",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * @route POST /admin/appeals/:entity/:appealId/decide
 * @desc Decide on an appeal (approve/reject)
 * @access Admin only (authorization handled upstream)
 */
router.post("/:entity/:appealId/decide", async (req: Request, res: Response): Promise<void> => {
  try {
    const entity = req.params.entity;
    const appealId = req.params.appealId;
    const { decision, adminComments, reviewerId } = req.body;
    
    if (!entity || !appealId) {
      res.status(400).json({ message: "Entity and appeal ID are required" });
      return;
    }
    
    if (!reviewerId) {
      res.status(400).json({ message: "Reviewer ID is required" });
      return;
    }
    
    // Validate entity type and map to correct format
    const entityMapping: Record<string, "user" | "song" | "album" | "playlist"> = {
      "users": "user",
      "songs": "song", 
      "albums": "album",
      "playlists": "playlist"
    };

    const mappedEntity = entityMapping[entity];
    if (!mappedEntity) {
      res.status(400).json({ 
        message: `Invalid entity type. Must be one of: ${Object.keys(entityMapping).join(", ")}` 
      });
      return;
    }

    // Validate decision
    if (!["approve", "reject"].includes(decision)) {
      res.status(400).json({ 
        message: "Decision must be either 'approve' or 'reject'" 
      });
      return;
    }

    // For user appeals, appealId is the appeal_id
    // For content appeals, appealId should be in format "entityId-userId" 
    let entityId: UUID | undefined;
    let userId: UUID;
    let userAppealId: UUID | undefined;

    if (entity === "users") {
      // For user appeals, appealId is the appeal_id
      userAppealId = appealId as UUID;
      userId = "" as UUID; // Will be determined by the repository
    } else {
      // For content appeals, parse the composite key
      const parts = appealId.split("-");
      if (parts.length !== 2) {
        res.status(400).json({ 
          message: "Invalid appeal ID format for content appeals. Expected format: entityId-userId" 
        });
        return;
      }
      entityId = parts[0] as UUID;
      userId = parts[1] as UUID;
    }

    // Get current timestamp for submittedAt
    const submittedAt = new Date().toISOString();

    await AdminAppealsService.decideAppeal(mappedEntity, {
      appealId: userAppealId,
      userId,
      entityId,
      submittedAt,
      action: decision as "approve" | "reject",
      reviewerId: reviewerId as UUID
    });
    
    res.json({
      success: true,
      message: `Appeal ${decision}d successfully`
    });
  } catch (error) {
    console.error("Error deciding appeal:", error);
    res.status(500).json({ 
      message: "Failed to decide on appeal",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;