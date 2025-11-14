import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { UserRepository } from "@repositories";
import { UserSettingsRepository } from "@repositories/userSettings.repository";
import { FollowService, HistoryService, LikeService } from "@services";
import { authenticateToken } from "@middleware/auth.middleware";

const router = express.Router();

// GET /api/users/settings - get user settings (must be before /:id route)
router.get("/settings", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const settings = await UserSettingsRepository.getOrCreate(userId);
    
    res.status(200).json({
      notifications: settings.notifications_enabled,
      isPrivate: settings.is_private,
    });
  } catch (error) {
    console.error("Error in GET /users/settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/settings - save user settings (must be before /:id route)
router.post("/settings", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { notifications, isPrivate } = req.body;

    const updated = await UserSettingsRepository.update(userId, {
      notifications_enabled: notifications,
      is_private: isPrivate,
    });

    res.status(200).json({
      message: "Settings updated successfully",
      notifications: updated.notifications_enabled,
      isPrivate: updated.is_private,
    });
  } catch (error) {
    console.error("Error in POST /users/settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/account - soft delete user account (sets status to DEACTIVATED)
// All associated data is preserved - user cannot login but profile remains in database
router.delete("/account", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Soft delete: mark user as DEACTIVATED instead of hard deleting
    const deactivated = await UserRepository.delete(userId);

    if (!deactivated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /users/account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/change-password - change user password (must be before /:id route)
router.post("/change-password", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required" });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }

    // Get the user
    const user = await UserRepository.getOne(userId);
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Validate current password using the email from authenticated user
    const validatedUser = await UserRepository.validateCredentials(user.email, currentPassword);
    
    if (!validatedUser) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    // Hash new password and update
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await UserRepository.update(userId, { password_hash });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in POST /users/change-password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
//! todo: no toggle method - post route for adding like, delete for removing
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

// GET /api/users/:id/likes/check
router.get(
  "/:id/likes/check",
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

// GET /api/users/:id/likes/songs
router.get(
  "/:id/likes/songs",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        includeAlbums,
        includeArtists,
        includeLikes,
        includeComments,
        limit,
        offset,
      } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const likedSongs = await LikeService.getLikedByUser(id, "song", {
        includeAlbums: includeAlbums === "true",
        includeArtists: includeArtists === "true",
        includeLikes: includeLikes === "true",
        includeComments: includeComments === "true",
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.status(200).json(likedSongs);
    } catch (error) {
      console.error("Error in GET /users/:id/likes/songs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/users/:id/likes/albums
router.get(
  "/:id/likes/albums",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        includeArtist,
        includeLikes,
        includeRuntime,
        includeSongCount,
        limit,
        offset,
      } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const likedAlbums = await LikeService.getLikedByUser(id, "album", {
        includeArtist: includeArtist === "true",
        includeLikes: includeLikes === "true",
        includeRuntime: includeRuntime === "true",
        includeSongCount: includeSongCount === "true",
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.status(200).json(likedAlbums);
    } catch (error) {
      console.error("Error in GET /users/:id/likes/albums:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/users/:id/likes/playlists
router.get(
  "/:id/likes/playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        includeUser,
        includeLikes,
        includeSongCount,
        includeRuntime,
        limit,
        offset,
      } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const likedPlaylists = await LikeService.getLikedByUser(id, "playlist", {
        includeUser: includeUser === "true",
        includeLikes: includeLikes === "true",
        includeSongCount: includeSongCount === "true",
        includeRuntime: includeRuntime === "true",
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.status(200).json(likedPlaylists);
    } catch (error) {
      console.error("Error in GET /users/:id/likes/playlists:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/users/:id/likes/comments
router.get(
  "/:id/likes/comments",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const likedComments = await LikeService.getLikedByUser(id, "comment", {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.status(200).json(likedComments);
    } catch (error) {
      console.error("Error in GET /users/:id/likes/comments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/users/:id/likes/count
router.get(
  "/:id/likes/count",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { entityType } = req.query;

    if (!id || !entityType) {
      res.status(400).json({ error: "Missing required parameters" });
      return;
    }

    try {
      const likedCount = await LikeService.getLikedCount(id, entityType as any);
      res.status(200).json({ likedCount });
    } catch (error) {
      console.error("Error in GET /users/:id/likes/count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/users/:id/followers
router.get(
  "/:id/followers",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const followers = await FollowService.getFollowers(id, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.status(200).json(followers);
    } catch (error) {
      console.error("Error in GET /users/:id/followers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/users/:id/followers/count
router.get(
  "/:id/followers/count",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const followerCount = await FollowService.getFollowerCount(id);
      res.status(200).json({ followerCount });
    } catch (error) {
      console.error("Error in GET /users/:id/follower-count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/users/:id/following
router.get(
  "/:id/following",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const following = await FollowService.getFollowing(id, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.status(200).json(following);
    } catch (error) {
      console.error("Error in GET /users/:id/following:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/users/:id/following/count
router.get(
  "/:id/following/count",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const followingCount = await FollowService.getFollowingCount(id);
      res.status(200).json({ followingCount });
    } catch (error) {
      console.error("Error in GET /users/:id/following-count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/users/:id/following
//! post following, delete following
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

// GET /api/users/:id/following/check
router.get(
  "/:id/following/check",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { followingId } = req.query;
    if (!id || !followingId) {
      res.status(400).json({ error: "Missing required parameters" });
      return;
    }

    try {
      const isFollowing = await FollowService.isFollowing(
        id,
        followingId as string
      );
      res.status(200).json({ isFollowing });
    } catch (error) {
      console.error("Error in GET /users/:id/following/check:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/users/:id/playlists
router.get(
  "/:id/playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { includeLikes, includeSongCount, includeRuntime, limit, offset } =
        req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const playlists = await UserRepository.getPlaylists(id, {
        includeLikes: includeLikes === "true",
        includeSongCount: includeSongCount === "true",
        includeRuntime: includeRuntime === "true",
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.status(200).json(playlists);
    } catch (error) {
      console.error("Error in GET /users/:id/playlists:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
