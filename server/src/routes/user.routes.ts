import express, { Request, Response } from "express";
import { UserRepository } from "@repositories";
import { FollowService, HistoryService, LikeService } from "@services";

const router = express.Router();

// GET /api/users
// Example:
// /api/users?includeFollowerCount=true&includeFollowingCount=true&limit=50&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeFollowerCount, includeFollowingCount, limit, offset } =
      req.query;

    const users = await UserRepository.getMany({
      includeFollowerCount: includeFollowerCount === "true",
      includeFollowingCount: includeFollowingCount === "true",
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in GET /users/:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id
// Example:
// /api/users/:id?includeFollowerCount=true&includeFollowingCount=true
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { includeFollowerCount, includeFollowingCount } = req.query;

  if (!id) {
    res.status(400).json({ error: "User ID is required" });
    return;
  }

  try {
    const user = await UserRepository.getOne(id, {
      includeFollowerCount: includeFollowerCount === "true",
      includeFollowingCount: includeFollowingCount === "true",
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in GET /users/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/:id/history
router.put(
  "/:id/history",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { entityId, entityType } = req.body;
    if (!id || !entityId || !entityType) {
      res.status(400).json({ error: "Missing required parameters" });
      return;
    }

    try {
      await HistoryService.addToHistory(id, entityId, entityType);
      res.status(200).json({ message: "History updated successfully" });
    } catch (error) {
      console.error("Error in PUT /users/:id/history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/users/:id/likes
router.post(
  "/:id/likes",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { entityId, entityType } = req.body;

    if (!id || !entityId || !entityType) {
      res.status(400).json({ error: "Missing required parameters" });
      return;
    }

    try {
      const result = await LikeService.toggleLike(id, entityId, entityType);
      res.status(200).json({ message: `${entityType} ${result} successfully` });
    } catch (error) {
      console.error("Error in POST /users/:id/likes:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/users/:id/likes?entityType=song&entityId=123
router.get("/:id/likes", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { entityType, entityId } = req.query;

  if (!id || !entityType || !entityId) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }

  try {
    const isLiked = await LikeService.hasUserLiked(
      id,
      entityId as string,
      entityType as any
    );
    res.status(200).json({ isLiked });
  } catch (error) {
    console.error("Error in GET /users/:id/likes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/:id/following
router.post(
  "/:id/following",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { followingId } = req.body;

    if (!id || !followingId) {
      res.status(400).json({ error: "Missing required parameters" });
      return;
    }

    try {
      const result = await FollowService.toggleFollow(id, followingId);
      res.status(200).json({ message: `User ${result} sucessfully` });
    } catch (error) {
      console.error("Error in POST /users/:id/following:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
