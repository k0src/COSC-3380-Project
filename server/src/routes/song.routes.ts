import express, { Request, Response } from "express";
import { SongRepository } from "@repositories";
import {
  handlePgError,
  getCoverGradient,
  parseAccessContext,
  generateWaveform,
} from "@util";
import { parseForm } from "@infra/form-parser";
import { CommentService, StatsService, LikeService } from "@services";
import { validateOrderBy } from "@validators";
import { authenticateToken } from "@middleware";

const router = express.Router();

/* ========================================================================== */
/*                                Main Routes                                 */
/* ========================================================================== */

// GET /api/songs/count
router.get("/count", async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await SongRepository.count();
    res.status(200).json({ count });
  } catch (error: any) {
    console.error("Error in GET /api/songs/count:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/songs/trending
router.get("/trending", async (req: Request, res: Response) => {
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

    const accessContext = parseAccessContext(req.query);

    const trendingSongs = await SongRepository.getTrendingSongs(accessContext, {
      includeAlbums: includeAlbums === "true",
      includeArtists: includeArtists === "true",
      includeLikes: includeLikes === "true",
      includeComments: includeComments === "true",
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(trendingSongs);
  } catch (error) {
    console.error("Error in GET /songs/trending:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/songs
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

    const accessContext = parseAccessContext(req.query);

    const songs = await SongRepository.getMany(accessContext, {
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
  } catch (error: any) {
    console.error("Error in GET /songs/", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/songs/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Song ID is required" });
      return;
    }

    const accessContext = parseAccessContext(req.query);
    const song = await SongRepository.getOne(id, accessContext, {
      includeAlbums: req.query.includeAlbums === "true",
      includeArtists: req.query.includeArtists === "true",
      includeLikes: req.query.includeLikes === "true",
      includeComments: req.query.includeComments === "true",
    });

    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }

    res.status(200).json(song);
  } catch (error: any) {
    console.error("Error in GET /songs/:id:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// POST /api/songs
router.post(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const songData = await parseForm(req, "song");

      try {
        songData.artists = JSON.parse(songData.artists);
      } catch (e) {
        res.status(400).json({ error: "Invalid artists data" });
        return;
      }

      if (!Array.isArray(songData.artists) || songData.artists.length === 0) {
        res.status(400).json({ error: "At least one artist is required" });
        return;
      }

      for (const artist of songData.artists) {
        if (
          !artist.role ||
          typeof artist.role !== "string" ||
          artist.role.trim() === ""
        ) {
          res.status(400).json({ error: "All artists must have a role" });
          return;
        }
      }

      const mainArtists = songData.artists.filter(
        (a: any) => a.role.toLowerCase() === "main"
      );
      if (mainArtists.length !== 1) {
        res
          .status(400)
          .json({ error: 'Exactly one artist must have the "Main" role' });
        return;
      }

      if (songData._audioBuffer) {
        const waveformData = await generateWaveform(songData._audioBuffer);
        if (waveformData) {
          songData.waveform_data = waveformData;
        }
        delete songData._audioBuffer;
      }

      const newSong = await SongRepository.create(songData);

      if (!newSong) {
        res.status(400).json({ error: "Failed to create song" });
        return;
      }

      res.status(200).json(newSong);
    } catch (error: any) {
      console.error("Error in POST /api/songs/:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// PUT /api/songs/:id
router.put(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      const songData = await parseForm(req, "song");

      if (songData.artists) {
        try {
          songData.artists = JSON.parse(songData.artists);
        } catch (e) {
          res.status(400).json({ error: "Invalid artists data" });
          return;
        }

        if (!Array.isArray(songData.artists)) {
          res.status(400).json({ error: "Artists must be an array" });
          return;
        }

        for (const artist of songData.artists) {
          if (
            !artist.id ||
            !artist.role ||
            typeof artist.role !== "string" ||
            artist.role.trim() === ""
          ) {
            res
              .status(400)
              .json({ error: "All artists must have an id and role" });
            return;
          }
        }
      }

      const updatedSong = await SongRepository.update(id, songData);

      if (!updatedSong) {
        res.status(404).json({ error: "Song not found" });
        return;
      }

      res.status(200).json(updatedSong);
    } catch (error: any) {
      console.error("Error in PUT /api/songs/:id:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// DELETE /api/songs/:id
router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      await SongRepository.delete(id);
      res.status(200).json({ message: "Song deleted successfully" });
    } catch (error: any) {
      console.error("Error in DELETE /api/songs/:id:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/songs/bulk-delete
router.post(
  "/bulk-delete",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { songIds } = req.body;

      if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
        res.status(400).json({ error: "Song IDs array is required" });
        return;
      }

      await SongRepository.bulkDelete(songIds);
      res.status(200).json({
        message: `${songIds.length} song${
          songIds.length === 1 ? "" : "s"
        } deleted successfully`,
      });
    } catch (error: any) {
      console.error("Error in POST /songs/bulk-delete:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

/* ========================================================================== */
/*                              Song Relations                                */
/* ========================================================================== */

// GET /api/songs/:id/suggestions
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

      const suggestions = await SongRepository.getSuggestedSongs(id, {
        userId: userId as string | undefined,
        includeAlbums: includeAlbums === "true",
        includeArtists: includeArtists === "true",
        includeLikes: includeLikes === "true",
        includeComments: includeComments === "true",
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.status(200).json(suggestions);
    } catch (error: any) {
      console.error("Error in GET /songs/:id/suggestions:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

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
        res.status(400).json({ error: "Song ID is required" });
        return;
      }

      let column = (orderByColumn as string) || "created_at";
      let direction = (orderByDirection as string) || "DESC";
      if (!validateOrderBy(column, direction, "album")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "created_at";
        direction = "DESC";
      }

      const accessContext = parseAccessContext(req.query);

      const albums = await SongRepository.getAlbums(id, accessContext, {
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
    } catch (error: any) {
      console.error("Error in GET /api/songs/:id/album:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// GET /api/songs/:id/artists
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

      const accessContext = parseAccessContext(req.query);

      const artists = await SongRepository.getArtists(id, accessContext, {
        includeUser: includeUser === "true",
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(artists);
    } catch (error: any) {
      console.error("Error in GET /api/songs/:id/artists:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

/* ========================================================================== */
/*                            Song Artist Management                          */
/* ========================================================================== */

// PUT /api/songs/:id/artist
router.put(
  "/:id/artist",
  authenticateToken,
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

      const success = await SongRepository.addArtist(id, artist_id, role);
      if (!success) {
        res.status(404).json({ error: "Song or Artist not found" });
        return;
      }

      res.status(200).json({ message: "Artist added to song successfully" });
    } catch (error: any) {
      console.error("Error in PUT /api/songs/:id/artist:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// DELETE /api/songs/:id/artist
router.delete(
  "/:id/artist",
  authenticateToken,
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

      const success = await SongRepository.removeArtist(id, artist_id);
      if (!success) {
        res.status(404).json({ error: "Song or Artist not found" });
        return;
      }

      res
        .status(204)
        .json({ message: "Artist removed from song successfully" });
    } catch (error: any) {
      console.error("Error in DELETE /api/songs/:id/artist:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

/* ========================================================================== */
/*                              Song Comments                                 */
/* ========================================================================== */

// GET /api/songs/:id/comments
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
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
        offset: req.query.offset
          ? parseInt(req.query.offset as string, 10)
          : undefined,
      });
      res.status(200).json(comments);
    } catch (error: any) {
      console.error("Error in GET /songs/:id/comments:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/songs/:id/comments
router.post(
  "/:id/comments",
  authenticateToken,
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
    } catch (error: any) {
      console.error("Error in POST /songs/:id/comments:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

/* ========================================================================== */
/*                              Song Metadata                                 */
/* ========================================================================== */

// GET /api/songs/:id/cover-gradient
router.get(
  "/:id/cover-gradient",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }

      const imageUrl = await SongRepository.getCoverImage(id);
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
      console.error("Error in GET /songs/:id/cover-gradient:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// PUT /api/songs/:id/streams
router.put(
  "/:id/streams",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Song ID is required!" });
        return;
      }
      const success = await SongRepository.incrementStreams(id);
      if (!success) {
        res.status(404).json({ error: "Song not found" });
        return;
      }
      res
        .status(200)
        .json({ message: "Song streams incremented successfully" });
    } catch (error: any) {
      console.error("Error in PUT /api/songs/:id/streams:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
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
    } catch (error: any) {
      console.error("Error in GET /api/songs/:id/weekly-plays:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
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
    } catch (error: any) {
      console.error("Error in GET /api/songs/:id/liked-by:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

export default router;
