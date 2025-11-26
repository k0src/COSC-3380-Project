import express, { Request, Response } from "express";
import { SearchService } from "@services";
import { handlePgError } from "@util";

const router = express.Router();

/* ========================================================================== */
/*                              Search Routes                                 */
/* ========================================================================== */

// GET /api/search?q=searchTerm&userId=userId&limit=limit&offset=offset
router.get("/", async (req: Request, res: Response) => {
  try {
    const { q: query, userId, limit, offset } = req.query;
    if (!query) {
      res.status(400).json({ error: "Query parameter is required." });
      return;
    }

    const results = await SearchService.search(query as string, {
      userId: userId as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json(results);
  } catch (error: any) {
    console.error("Search failed:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/search/songs?q=searchTerm&userId=userId&limit=limit&offset=offset
router.get("/songs", async (req: Request, res: Response) => {
  try {
    const { q: query, userId, limit, offset } = req.query;
    if (!query) {
      res.status(400).json({ error: "Query parameter is required." });
      return;
    }

    const results = await SearchService.searchSongs(query as string, {
      userId: userId as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json(results);
  } catch (error: any) {
    console.error("Error in GET /search/songs:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/search/playlists?q=searchTerm&userId=userId&limit=limit&offset=offset
router.get("/playlists", async (req: Request, res: Response) => {
  try {
    const { q: query, userId, limit, offset } = req.query;
    if (!query) {
      res.status(400).json({ error: "Query parameter is required." });
      return;
    }

    const results = await SearchService.searchPlaylists(query as string, {
      userId: userId as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json(results);
  } catch (error: any) {
    console.error("Error in GET /search/playlists:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/search/artists?q=searchTerm&userId=userId&limit=limit&offset=offset
router.get("/artists", async (req: Request, res: Response) => {
  try {
    const { q: query, userId, limit, offset } = req.query;
    if (!query) {
      res.status(400).json({ error: "Query parameter is required." });
      return;
    }

    const results = await SearchService.searchArtists(query as string, {
      userId: userId as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json(results);
  } catch (error: any) {
    console.error("Search artists failed:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/search/albums?q=searchTerm&userId=userId&limit=limit&offset=offset
router.get("/albums", async (req: Request, res: Response) => {
  try {
    const { q: query, userId, limit, offset } = req.query;
    if (!query) {
      res.status(400).json({ error: "Query parameter is required." });
      return;
    }

    const results = await SearchService.searchAlbums(query as string, {
      userId: userId as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json(results);
  } catch (error: any) {
    console.error("Error in GET /search/albums:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/search/users?q=searchTerm&userId=userId&limit=limit&offset=offset
router.get("/users", async (req: Request, res: Response) => {
  try {
    const { q: query, userId, limit, offset } = req.query;
    if (!query) {
      res.status(400).json({ error: "Query parameter is required." });
      return;
    }

    const results = await SearchService.searchUsers(query as string, {
      userId: userId as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json(results);
  } catch (error: any) {
    console.error("Search users failed:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

export default router;
