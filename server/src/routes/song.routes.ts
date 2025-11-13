import express, { Request, Response } from "express";
import { SongRepository as SongRepo } from "@repositories";
import { parseSongForm } from "@infra/form-parser";
import getCoverGradient from "@util/colors.util";
import { CommentService, StatsService, LikeService } from "@services";
import { validateOrderBy } from "@validators";

const router = express.Router();

// GET /api/songs
// Example:
// /api/songs?includeAlbum=true&includeArtists=true&includeLikes=true&includeComments=true&limit=50&offset=0
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      includeAlbums,
      includeArtists,
      includeLikes,
      includeComments,
      orderByColumn,
      orderByDirection,
      limit,
      offset,
    } = req.query;

    let column = (orderByColumn as string) || "created_at";
    let direction = (orderByDirection as string) || "DESC";

    if (!validateOrderBy(column, direction, "song")) {
      console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
      column = "created_at";
      direction = "DESC";
    }

    const songs = await SongRepo.getMany({
      includeAlbums: includeAlbums === "true",
      includeArtists: includeArtists === "true",
      includeLikes: includeLikes === "true",
      includeComments: includeComments === "true",
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(songs);
  } catch (error) {
    console.error("Error in GET /songs/", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/songs/:id
// Example:
// /api/songs/:id?includeAlbum=true&includeArtists=true&includeLikes=true&includeComments=true
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeAlbums, includeArtists, includeLikes, includeComments } =
      req.query;
    if (!id) {
      res.status(400).json({ error: "Song ID is required" });
      return;
    }

    const song = await SongRepo.getOne(id, {
      includeAlbums: includeAlbums === "true",
      includeArtists: includeArtists === "true",
      includeLikes: includeLikes === "true",
      includeComments: includeComments === "true",
    });
    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }

    res.status(200).json(song);
  } catch (error) {
    console.error("Error in GET /songs/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get(
  "/:id/suggestions",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        userId,
        includeAlbums,
        includeArtists,
        includeLikes,
        includeComments,
        limit,
        offset,
      } = req.query;
      if (!id) {
        res.status(400).json({ error: "Song ID is required" });
        return;
      }

      const suggestions = await SongRepo.getSuggestedSongs(id, {
        userId: userId as string | undefined,
        includeAlbums: includeAlbums === "true",
        includeArtists: includeArtists === "true",
        includeLikes: includeLikes === "true",
        includeComments: includeComments === "true",
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.status(200).json(suggestions);
    } catch (error) {
      console.error("Error in GET /songs/:id/suggestions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/:id/comments",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      const comments = await CommentService.getCommentsBySongId(id, {
        includeLikes: req.query.includeLikes === "true",
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
        offset: req.query.offset
          ? parseInt(req.query.offset as string, 10)
          : undefined,
      });
      res.status(200).json(comments);
    } catch (error) {
      console.error("Error in GET /songs/:id/comments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post(
  "/:id/comments",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, commentText } = req.body;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      if (!userId || !commentText) {
        res
          .status(400)
          .json({ error: "User ID and comment text are required!" });
        return;
      }

      const commentId = await CommentService.addComment(
        userId,
        id,
        commentText
      );
      res.status(201).json({ id: commentId });
    } catch (error) {
      console.error("Error in POST /songs/:id/comments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/:id/cover-gradient",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      const song = await SongRepo.getOne(id);
      if (!song) {
        res.status(404).json({ error: "Song not found" });
        return;
      }
      if (!song.image_url) {
        res.status(200).json({
          color1: { r: 8, g: 8, b: 8 },
          color2: { r: 213, g: 49, b: 49 },
        });
        return;
      }

      const gradient = await getCoverGradient(song.image_url);
      res.status(200).json(gradient);
    } catch (error) {
      console.error("Error in GET /songs/:id/cover-gradient:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/songs/ -> create new song
// NEED auth protection
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    let { title, duration, genre, release_date, audio_url, image_url } =
      await parseSongForm(req, "upload");
    if (!title || !genre || !duration || !audio_url) {
      res
        .status(400)
        .json({ error: "Missing or invalid required song fields." });
      return;
    }

    // If we didn't get a release_date, set it to today
    if (!release_date) {
      release_date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    }

    const success = await SongRepo.insert({
      title,
      duration,
      genre,
      release_date,
      audio_url,
      image_url,
    });
    if (!success) {
      res.status(500).json({ error: "Failed to create song" });
      return;
    }

    res.status(201).json({ message: "Song created successfully" });
  } catch (error) {
    console.error("Error in POST /songs/:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/songs/:id -> update song
// NEED auth protection
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Song ID is required!" });
      return;
    }

    const songData = await parseSongForm(req, "update");
    const success = await SongRepo.update(id, songData);
    if (!success) {
      res.status(404).json({ error: "Song not found" });
      return;
    }

    res.status(200).json({ message: "Song updated successfully" });
  } catch (error) {
    console.error("Error in PUT /api/songs/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/songs/:id -> delete song
// NEED auth protection
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Song ID is required!" });
      return;
    }

    const success = await SongRepo.delete(id);
    if (!success) {
      res.status(404).json({ error: "Song not found" });
      return;
    }

    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/songs/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put(
  "/:id/streams",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }
      const success = await SongRepo.incrementStreams(id);
      if (!success) {
        res.status(404).json({ error: "Song not found" });
        return;
      }
      res
        .status(200)
        .json({ message: "Song streams incremented successfully" });
    } catch (error) {
      console.error("Error in PUT /api/songs/:id/streams:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/songs/:id/artist -> add artist to song
// NEED auth protection
router.put(
  "/:id/artist",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      const { artist_id, role } = req.body;
      if (!artist_id || !role) {
        res.status(400).json({ error: "Artist ID and role are required!" });
        return;
      }

      const success = await SongRepo.addArtist(id, artist_id, role);
      if (!success) {
        res.status(404).json({ error: "Song or Artist not found" });
        return;
      }

      res.status(200).json({ message: "Artist added to song successfully" });
    } catch (error) {
      console.error("Error in PUT /api/songs/:id/artist:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/songs/:id/artist -> remove artist from song
// NEED auth protection
router.delete(
  "/:id/artist",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      const { artist_id } = req.body;
      if (!artist_id) {
        res.status(400).json({ error: "Artist ID is required!" });
        return;
      }

      const success = await SongRepo.removeArtist(id, artist_id);
      if (!success) {
        res.status(404).json({ error: "Song or Artist not found" });
        return;
      }

      res
        .status(204)
        .json({ message: "Artist removed from song successfully" });
    } catch (error) {
      console.error("Error in DELETE /api/songs/:id/artist:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/songs/count
router.get("/count", async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await SongRepo.count();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error in GET /api/songs/count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/songs/:id/albums
router.get(
  "/:id/albums",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        includeArtist,
        includeLikes,
        includeRuntime,
        includeSongCount,
        orderByColumn,
        orderByDirection,
        limit,
        offset,
      } = req.query;

      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      let column = (orderByColumn as string) || "created_at";
      let direction = (orderByDirection as string) || "DESC";

      if (!validateOrderBy(column, direction, "album")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "created_at";
        direction = "DESC";
      }

      const albums = await SongRepo.getAlbums(id, {
        includeArtist: includeArtist === "true",
        includeLikes: includeLikes === "true",
        includeRuntime: includeRuntime === "true",
        includeSongCount: includeSongCount === "true",
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(albums);
    } catch (error) {
      console.error("Error in GET /api/songs/:id/album:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/songs/:id/artists
// Example:
// /api/songs/:id/artists/?includeUser=true&limit=50&offset=0
router.get(
  "/:id/artists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { includeUser, orderByColumn, orderByDirection, limit, offset } =
        req.query;

      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      let column = (orderByColumn as string) || "created_at";
      let direction = (orderByDirection as string) || "DESC";

      if (!validateOrderBy(column, direction, "artist")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "created_at";
        direction = "DESC";
      }

      const artists = await SongRepo.getArtists(id, {
        includeUser: includeUser === "true",
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(artists);
    } catch (error) {
      console.error("Error in GET /api/songs/:id/artists:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/songs/:id/weekly-plays
router.get(
  "/:id/weekly-plays",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      const weeklyPlays = await StatsService.getWeeklyPlays(id);
      res.status(200).json(weeklyPlays);
    } catch (error) {
      console.error("Error in GET /api/songs/:id/weekly-plays:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/songs/:id/liked-by
router.get(
  "/:id/liked-by",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      const users = await LikeService.getUsersWhoLiked(id, "song", {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.status(200).json(users);
    } catch (error) {
      console.error("Error in GET /api/songs/:id/liked-by:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
