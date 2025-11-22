import express, { Request, Response } from "express";
import { UserRepository } from "@repositories";
import {
  FollowService,
  HistoryService,
  LikeService,
  LibraryService,
  UserSettingsService,
  NotificationsService,
} from "@services";
import { parseForm } from "@infra/form-parser";
import { parseAccessContext, handlePgError } from "@util";
import { validateOrderBy } from "@validators";
import { authenticateToken } from "@middleware";

const router = express.Router();

/* ========================================================================== */
/*                                 Main Routes                                */
/* ========================================================================== */

// GET /api/users/count
router.get("/count", async (req: Request, res: Response): Promise<void> => {
  try {
    const userCount = await UserRepository.getUserCount();
    res.status(200).json({ userCount });
  } catch (error: any) {
    console.error("Error in GET /users/count:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/users
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
  } catch (error: any) {
    console.error("Error in GET /users/:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/users/:id
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
  } catch (error: any) {
    console.error("Error in GET /users/:id:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// DELETE /api/users/:id
router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      const deletedUser = await UserRepository.delete(id);

      if (!deletedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error in DELETE /users/:id:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// PUT /api/users/:id
router.put(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      const updateData = await parseForm(req, "user");
      const updatedUser = await UserRepository.update(id, updateData);

      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json(updatedUser);
    } catch (error: any) {
      console.error("Error in PUT /users/:id:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

/* ========================================================================== */
/*                               User Playlists                               */
/* ========================================================================== */

// GET /api/users/:id/playlists
router.get(
  "/:id/playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        includeLikes,
        includeSongCount,
        includeRuntime,
        orderByColumn,
        orderByDirection,
        limit,
        offset,
      } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      let column = (orderByColumn as string) || "created_at";
      let direction = (orderByDirection as string) || "DESC";

      if (!validateOrderBy(column, direction, "playlist")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "created_at";
        direction = "DESC";
      }

      const accessContext = parseAccessContext(req.query);

      const playlists = await UserRepository.getPlaylists(id, accessContext, {
        includeLikes: includeLikes === "true",
        includeSongCount: includeSongCount === "true",
        includeRuntime: includeRuntime === "true",
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.status(200).json(playlists);
    } catch (error: any) {
      console.error("Error in GET /users/:id/playlists:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

/* ========================================================================== */
/*                                User Library                                */
/* ========================================================================== */

// GET /api/users/:id/library/recent
router.get(
  "/:id/library/recent",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { maxItems, array } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      if (array === "true") {
        const recentHistory = await LibraryService.getRecentlyPlayedArray(
          id,
          maxItems ? parseInt(maxItems as string, 10) : 10
        );
        res.status(200).json(recentHistory);
        return;
      }

      const recentHistory = await LibraryService.getRecentlyPlayed(
        id,
        maxItems ? parseInt(maxItems as string, 10) : 10
      );

      res.status(200).json(recentHistory);
    } catch (error: any) {
      console.error("Error in GET /users/:id/library/recent:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/users/:id/library/playlists
router.get(
  "/:id/library/playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset, omitLikes } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const playlists = await LibraryService.getLibraryPlaylists(id, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
        omitLikes: omitLikes === "true",
      });

      res.status(200).json(playlists);
    } catch (error: any) {
      console.error("Error in GET /users/:id/library/playlists:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/users/:id/library/playlists/pin
router.post(
  "/:id/library/playlists/pin",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { playlistId } = req.body;
      if (!id || !playlistId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      const result = await LibraryService.togglePinPlaylist(id, playlistId);
      res.status(200).json({
        message: `Playlist ${result ? "pinned" : "unpinned"} succesfully`,
      });
    } catch (error: any) {
      console.error("Error in POST /users/:id/library/playlists/pin:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/users/:id/library/songs
router.get(
  "/:id/library/songs",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const songs = await LibraryService.getLibrarySongs(id, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(songs);
    } catch (error: any) {
      console.error("Error in GET /users/:id/library/songs:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/users/:id/library/albums
router.get(
  "/:id/library/albums",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const albums = await LibraryService.getLibraryAlbums(id, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(albums);
    } catch (error: any) {
      console.error("Error in GET /users/:id/library/albums:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/users/:id/library/artists
router.get(
  "/:id/library/artists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const artists = await LibraryService.getLibraryArtists(id, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(artists);
    } catch (error: any) {
      console.error("Error in GET /users/:id/library/artists:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/users/:id/library?q=searchTerm
router.get(
  "/:id/library",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { q } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      if (!q || typeof q !== "string") {
        res.status(400).json({ error: "Search query is required" });
        return;
      }

      const searchResults = await LibraryService.search(id, q);

      res.status(200).json(searchResults);
    } catch (error: any) {
      console.error("Error in GET /users/:id/library:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

/* ============================== User History ============================== */

// GET /api/users/:id/library/history/songs
router.get(
  "/:id/library/history/songs",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { timeRange, limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const songs = await LibraryService.getSongHistory(id, {
        timeRange: timeRange as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(songs);
    } catch (error: any) {
      console.error("Error in GET /users/:id/library/history/songs:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/users/:id/library/history/playlists
router.get(
  "/:id/library/history/playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { timeRange, limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const playlists = await LibraryService.getPlaylistHistory(id, {
        timeRange: timeRange as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(playlists);
    } catch (error: any) {
      console.error(
        "Error in GET /users/:id/library/history/playlists:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/users/:id/library/history/albums
router.get(
  "/:id/library/history/albums",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { timeRange, limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const albums = await LibraryService.getAlbumHistory(id, {
        timeRange: timeRange as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(albums);
    } catch (error: any) {
      console.error("Error in GET /users/:id/library/history/albums:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/users/:id/library/history/artists
router.get(
  "/:id/library/history/artists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { timeRange, limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const artists = await LibraryService.getArtistHistory(id, {
        timeRange: timeRange as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(artists);
    } catch (error: any) {
      console.error("Error in GET /users/:id/library/history/artists:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

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
    } catch (error: any) {
      console.error("Error in PUT /users/:id/history:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

/* ========================================================================== */
/*                            User Likes & Comments                           */
/* ========================================================================== */

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
    } catch (error: any) {
      console.error("Error in GET /users/:id/likes/songs:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
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
    } catch (error: any) {
      console.error("Error in GET /users/:id/likes/albums:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
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
    } catch (error: any) {
      console.error("Error in GET /users/:id/likes/playlists:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
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
    } catch (error: any) {
      console.error("Error in GET /users/:id/likes/comments:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/users/:id/likes
router.post(
  "/:id/likes",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { entityId, entityType } = req.body;
      if (!id || !entityId || !entityType) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      const result = await LikeService.toggleLike(id, entityId, entityType);
      res.status(200).json({ message: `${entityType} ${result} successfully` });
    } catch (error: any) {
      console.error("Error in POST /users/:id/likes:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
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
    } catch (error: any) {
      console.error("Error in GET /users/:id/likes:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
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
    } catch (error: any) {
      console.error("Error in GET /users/:id/likes/count:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

/* ========================================================================== */
/*                               User Followers                               */
/* ========================================================================== */

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
    } catch (error: any) {
      console.error("Error in GET /users/:id/followers:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
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
    } catch (error: any) {
      console.error("Error in GET /users/:id/following:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/users/:id/following
router.post(
  "/:id/following",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { followingId } = req.body;
      if (!id || !followingId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      const result = await FollowService.toggleFollow(id, followingId);
      res.status(200).json({ message: `User ${result} sucessfully` });
    } catch (error: any) {
      console.error("Error in POST /users/:id/following:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
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
    } catch (error: any) {
      console.error("Error in GET /users/:id/follower-count:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
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
    } catch (error: any) {
      console.error("Error in GET /users/:id/following-count:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
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
    } catch (error: any) {
      console.error("Error in GET /users/:id/following/check:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

/* ========================================================================== */
/*                                User Settings                               */
/* ========================================================================== */

// GET /api/users/:id/settings
router.get(
  "/:id/settings",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      const settings = await UserSettingsService.getSettings(id);
      res.status(200).json(settings);
    } catch (error: any) {
      console.error("Error in GET /users/:id/settings:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// PUT /api/users/:id/settings
router.put(
  "/:id/settings",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      const {
        release_notifications,
        playlist_like_notifications,
        follower_notifications,
        comment_tag_notifications,
        color_scheme,
        color_theme,
        zoom_level,
        artist_like_notifications,
        song_comment_notifications,
        songs_discoverable,
      } = req.body;

      const updatedSettings = await UserSettingsService.updateSettings(id, {
        release_notifications,
        playlist_like_notifications,
        follower_notifications,
        comment_tag_notifications,
        color_scheme,
        color_theme,
        zoom_level,
        artist_like_notifications,
        song_comment_notifications,
        songs_discoverable,
      });
      res.status(200).json(updatedSettings);
    } catch (error: any) {
      console.error("Error in PUT /users/:id/settings:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

/* ========================================================================== */
/*                             User Notifications                             */
/* ========================================================================== */

// GET /api/users/:id/notifications
router.get(
  "/:id/notifications",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { includeRead } = req.query;
      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const notifications = await NotificationsService.getNotifications(
        id,
        includeRead === "true"
      );

      res.status(200).json(notifications);
    } catch (error: any) {
      console.error("Error in GET /users/:id/notifications:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/users/:id/notifications/check
router.get(
  "/:id/notifications/check",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const hasUnread = await NotificationsService.hasUnreadNotifications(id);
      res.status(200).json({ hasUnread });
    } catch (error: any) {
      console.error("Error in GET /users/:id/notifications/check:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// PUT /api/users/:id/notifications/:notificationId/read
router.put(
  "/:id/notifications/:notificationId/read",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, notificationId } = req.params;
      if (!id || !notificationId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      await NotificationsService.markAsRead(id, notificationId);
      res.status(200).json({ message: "Notification marked as read" });
    } catch (error: any) {
      console.error(
        "Error in PUT /users/:id/notifications/:notificationId/read:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/users/:id/notifications/read-all
router.post(
  "/:id/notifications/read-all",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      await NotificationsService.markAllAsRead(id);
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error: any) {
      console.error("Error in POST /users/:id/notifications/read-all:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// PUT /api/users/:id/notifications/:notificationId/archive
router.put(
  "/:id/notifications/:notificationId/archive",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, notificationId } = req.params;
      if (!id || !notificationId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      await NotificationsService.archive(id, notificationId);
      res.status(200).json({ message: "Notification archived successfully" });
    } catch (error: any) {
      console.error(
        "Error in PUT /users/:id/notifications/:notificationId/archive:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/users/:id/notifications/archive-all
router.post(
  "/:id/notifications/archive-all",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const reqUserId = req.userId;
      if (!reqUserId || reqUserId !== id) {
        res.status(403).json({
          error:
            "Forbidden: You do not have permission to perform this action.",
        });
        return;
      }

      await NotificationsService.archiveAll(id);
      res
        .status(200)
        .json({ message: "All notifications archived successfully" });
    } catch (error: any) {
      console.error(
        "Error in POST /users/:id/notifications/archive-all:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

export default router;
