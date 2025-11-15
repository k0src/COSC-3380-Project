import express, { Request, Response } from "express";
import { UserRepository } from "@repositories";
import {
  FollowService,
  HistoryService,
  LikeService,
  LibraryService,
  UserSettingsService,
} from "@services";
import { parseUserUpdateForm } from "@infra/form-parser";

const router = express.Router();

/* ========================================================================== */
/*                                 Main Routes                                */
/* ========================================================================== */

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
  } catch (error) {
    console.error("Error in GET /users/:", error);
    res.status(500).json({ error: "Internal server error" });
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
  } catch (error) {
    console.error("Error in GET /users/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "User ID is required" });
    return;
  }

  try {
    const deletedUser = await UserRepository.delete(id);

    if (!deletedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /users/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/:id
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "User ID is required" });
    return;
  }

  try {
    const updateData = await parseUserUpdateForm(req);
    const updatedUser = await UserRepository.update(id, updateData);

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error("Error in PUT /users/:id:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(400).json({ error: errorMessage });
  }
});

/* ========================================================================== */
/*                               User Playlists                               */
/* ========================================================================== */

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
    } catch (error) {
      console.error("Error in GET /users/:id/library/recent:", error);
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error("Error in GET /users/:id/library/playlists:", error);
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error("Error in GET /users/:id/library/songs:", error);
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error("Error in GET /users/:id/library/albums:", error);
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error("Error in GET /users/:id/library/artists:", error);
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error("Error in GET /users/:id/library:", error);
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error("Error in GET /users/:id/library/history/songs:", error);
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error(
        "Error in GET /users/:id/library/history/playlists:",
        error
      );
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error("Error in GET /users/:id/library/history/albums:", error);
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error("Error in GET /users/:id/library/history/artists:", error);
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error("Error in PUT /users/:id/history:", error);
      res.status(500).json({ error: "Internal server error" });
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
    } catch (error) {
      console.error("Error in GET /users/:id/followers:", error);
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

/* ========================================================================== */
/*                                User Settings                               */
/* ========================================================================== */

// GET /api/users/:id/settings
router.get(
  "/:id/settings",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    try {
      const settings = await UserSettingsService.getSettings(id);
      res.status(200).json(settings);
    } catch (error) {
      console.error("Error in GET /users/:id/settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/users/:id/settings
router.put(
  "/:id/settings",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "User ID is required" });
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

    try {
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
    } catch (error) {
      console.error("Error in PUT /users/:id/settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
