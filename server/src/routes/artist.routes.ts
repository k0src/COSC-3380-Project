import express, { Request, Response } from "express";
import { ArtistRepository } from "@repositories";
import { validateOrderBy } from "@validators";
import { parseForm } from "@infra/form-parser";
import { handlePgError, parseAccessContext } from "@util";
import { authenticateToken } from "@middleware";

const router = express.Router();

/* ========================================================================== */
/*                                Main Routes                                 */
/* ========================================================================== */

// GET /api/artists
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderByColumn, orderByDirection, limit, offset } = req.query;

    let column = (orderByColumn as string) || "created_at";
    let direction = (orderByDirection as string) || "DESC";
    if (!validateOrderBy(column, direction, "artist")) {
      console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
      column = "created_at";
      direction = "DESC";
    }

    const accessContext = parseAccessContext(req.query);
    const artists = await ArtistRepository.getManyArtists(accessContext, {
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(artists);
  } catch (error: any) {
    console.error("Error in GET /artists/:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/artists/top-artist
router.get("/top-artist", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 30;
    const topArtist = await ArtistRepository.getTopArtist(days);

    if (!topArtist) {
      res.status(404).json({ message: "Top artist not found" });
      return;
    }

    res.status(200).json(topArtist);
  } catch (error) {
    console.error("Error in GET /artists/top-artist:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/artists/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Artist ID is required" });
      return;
    }

    const accessContext = parseAccessContext(req.query);
    const artist = await ArtistRepository.getArtistDetails(id, accessContext);

    if (!artist) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }

    res.status(200).json(artist);
  } catch (error: any) {
    console.error("Error in GET /artists/:id:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// POST /api/artists
router.post(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const artistData = await parseForm(req, "artist");
      const newArtist = await ArtistRepository.create(artistData);

      if (!newArtist) {
        res.status(400).json({ error: "Failed to create artist" });
        return;
      }

      res.status(200).json(newArtist);
    } catch (error: any) {
      console.error("Error in POST /api/artists/:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// PUT /api/artists/:id
router.put(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required!" });
        return;
      }

      const artistData = await parseForm(req, "artist");
      const updatedArtist = await ArtistRepository.update(id, artistData);

      if (!updatedArtist) {
        res.status(404).json({ error: "Artist not found" });
        return;
      }

      res.status(200).json(updatedArtist);
    } catch (error: any) {
      console.error("Error in PUT /api/artists/:id:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// DELETE /api/artists/:id
router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required!" });
        return;
      }

      await ArtistRepository.delete(id);
      res.status(200).json({ message: "Artist deleted successfully" });
    } catch (error: any) {
      console.error("Error in DELETE /api/artists/:id:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

/* ========================================================================== */
/*                              Artist Content                                */
/* ========================================================================== */

// GET /api/artists/:id/songs
router.get("/:id/songs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderByColumn, orderByDirection, limit, offset } = req.query;
    if (!id) {
      res.status(400).json({ error: "Artist ID is required" });
      return;
    }

    let column = (orderByColumn as string) || "created_at";
    let direction = (orderByDirection as string) || "DESC";
    if (!validateOrderBy(column, direction, "song")) {
      console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
      column = "created_at";
      direction = "DESC";
    }

    const accessContext = parseAccessContext(req.query);
    const songs = await ArtistRepository.getSongs(id, accessContext, {
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(songs);
  } catch (error: any) {
    console.error("Error in GET /artists/:id/songs:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

// GET /api/artists/:id/singles
router.get(
  "/:id/singles",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { orderByColumn, orderByDirection, limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      let column = (orderByColumn as string) || "created_at";
      let direction = (orderByDirection as string) || "DESC";
      if (!validateOrderBy(column, direction, "song")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "created_at";
        direction = "DESC";
      }

      const accessContext = parseAccessContext(req.query);
      const singles = await ArtistRepository.getSingles(id, accessContext, {
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(singles);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/singles:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/artists/:id/albums
router.get(
  "/:id/albums",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { orderByColumn, orderByDirection, limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
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
      const albums = await ArtistRepository.getAlbums(id, accessContext, {
        orderByColumn: column as any,
        orderByDirection: direction as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(albums);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/albums:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/artists/:id/pinned-album
router.get(
  "/:id/pinned-album",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const accessContext = parseAccessContext(req.query);
      const album = await ArtistRepository.getPinnedAlbum(id, accessContext);

      if (!album) {
        res.status(404).json({ error: "Album not found" });
        return;
      }

      res.status(200).json(album);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/pinned-album:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// POST /api/artists/:id/pin-album
router.post(
  "/:id/pin-album",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { albumId } = req.body;
      if (!id || !albumId) {
        res.status(400).json({ error: "Artist ID and Album ID are required" });
        return;
      }

      await ArtistRepository.pinAlbumToArtistPage(id, albumId);
      res.status(200).json({ message: "Album pinned successfully" });
    } catch (error: any) {
      console.error("Error in POST /artists/:id/pin-album:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/artists/:id/unpin-album
router.post(
  "/:id/unpin-album",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { albumId } = req.body;
      if (!id || !albumId) {
        res.status(400).json({ error: "Artist ID and Album ID are required" });
        return;
      }

      await ArtistRepository.unPinAlbumFromArtistPage(id, albumId);
      res.status(200).json({ message: "Album unpinned successfully" });
    } catch (error: any) {
      console.error("Error in POST /artists/:id/unpin-album:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// GET /api/artists/:id/playlists
router.get(
  "/:id/playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { orderByColumn, orderByDirection, limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
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
      const playlists = await ArtistRepository.getFeaturedOnPlaylists(
        id,
        accessContext,
        {
          orderByColumn: column as any,
          orderByDirection: direction as any,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        }
      );

      res.status(200).json(playlists);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/playlists:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/artists/:id/artist-playlists
router.get(
  "/:id/artist-playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { orderByColumn, orderByDirection, limit, offset } = req.query;

      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
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
      const artistPlaylists = await ArtistRepository.getArtistPlaylists(
        id,
        accessContext,
        {
          orderByColumn: column as any,
          orderByDirection: direction as any,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        }
      );

      res.status(200).json(artistPlaylists);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/artist-playlists:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

/* ========================================================================== */
/*                              Artist Stats                                  */
/* ========================================================================== */

// GET /api/artists/:id/count/songs
router.get(
  "/:id/count/songs",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const numberOfSongs = await ArtistRepository.getNumberOfSongs(id);
      res.status(200).json({ numberOfSongs });
    } catch (error: any) {
      console.error("Error in GET /artists/:id/count/songs:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/artists/:id/count/streams
router.get(
  "/:id/count/streams",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const streams = await ArtistRepository.getTotalStreams(id);
      res.status(200).json({ streams });
    } catch (error: any) {
      console.error("Error in GET /artists/:id/count/streams:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/artists/:id/count/monthly-listeners
router.get(
  "/:id/count/monthly-listeners",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const monthlyListeners = await ArtistRepository.getMonthlyListeners(id);
      res.status(200).json({ monthlyListeners });
    } catch (error: any) {
      console.error(
        "Error in GET /artists/:id/count/monthly-listeners:",
        error
      );
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

/* ========================================================================== */
/*                              Artist Related                                */
/* ========================================================================== */

// GET /api/artists/:id/related
router.get(
  "/:id/related",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const relatedArtists = await ArtistRepository.getRelatedArtists(id, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(relatedArtists);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/related:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/artists/recommendations/:userId
router.get("/recommendations/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit, offset } = req.query;
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const artistRecommendations =
      await ArtistRepository.getArtistRecommendations(userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

    res.status(200).json(artistRecommendations);
  } catch (error) {
    console.error("Error in GET /artists/recommendations/:userId:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/artists/recommendations/:userId/followed/songs
router.get(
  "/recommendations/:userId/followed/songs",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { orderByColumn, orderByDirection, limit, offset } = req.query;
      if (!userId) {
        res.status(400).json({ error: "Missing userId parameter" });
        return;
      }

      let column = (orderByColumn as string) || "created_at";
      let direction = (orderByDirection as string) || "DESC";
      if (!validateOrderBy(column, direction, "song")) {
        console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
        column = "created_at";
        direction = "DESC";
      }

      const accessContext = parseAccessContext(req);
      const songs = await ArtistRepository.getNewFromFollowedArtists(
        userId,
        accessContext,
        {
          orderByColumn: column as any,
          orderByDirection: direction as any,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        }
      );

      res.status(200).json(songs);
    } catch (error: any) {
      console.error("Error in GET /songs/", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

/* ========================================================================== */
/*                              Artist Checks                                 */
/* ========================================================================== */

// GET /api/artists/:id/has-artist-playlists
router.get(
  "/:id/has/artist-playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const hasPlaylists = await ArtistRepository.checkArtistHasArtistPlaylists(
        id
      );
      res.status(200).json({ hasPlaylists });
    } catch (error: any) {
      console.error("Error in GET /artists/:id/has-artist-playlists:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

// GET /api/artists/:id/has-songs
router.get(
  "/:id/has/songs",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const hasSongs = await ArtistRepository.checkArtistHasSongs(id);
      res.status(200).json({ hasSongs });
    } catch (error: any) {
      console.error("Error in GET /artists/:id/has-songs:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
      return;
    }
  }
);

export default router;
