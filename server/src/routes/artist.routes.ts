import express, { Request, Response } from "express";
import { ArtistRepository } from "@repositories";
import { validateOrderBy } from "@validators";
import { FollowService } from "@services";
import { parseForm } from "@infra/form-parser";
import { handlePgError, parseAccessContext } from "@util";

const router = express.Router();

// GET /api/artists
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeUser, orderByColumn, orderByDirection, limit, offset } =
      req.query;

    let column = (orderByColumn as string) || "created_at";
    let direction = (orderByDirection as string) || "DESC";

    if (!validateOrderBy(column, direction, "artist")) {
      console.warn(`Invalid orderBy parameters: ${column} ${direction}`);
      column = "created_at";
      direction = "DESC";
    }

    const artists = await ArtistRepository.getMany({
      includeUser: includeUser === "true",
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(artists);
  } catch (error: any) {
    console.error("Error in GET /artists/:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// GET /api/artists/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { includeUser } = req.query;

  if (!id) {
    res.status(400).json({ error: "Artist ID is required" });
    return;
  }

  try {
    const artist = await ArtistRepository.getOne(id, {
      includeUser: includeUser === "true",
    });

    if (!artist) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }

    res.status(200).json(artist);
  } catch (error: any) {
    console.error("Error in GET /artists/:id:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// POST /api/artists
router.post("/", async (req: Request, res: Response): Promise<void> => {
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
  }
});

// PUT /api/artists/:id
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
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
  }
});

// DELETE /api/artists/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Artist ID is required!" });
      return;
    }

    const deleted = await ArtistRepository.delete(id);
    if (!deleted) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }

    res.status(200).json({ message: "Artist deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/artists/:id:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

// GET /api/artists/:id/songs
router.get("/:id/songs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      includeAlbums,
      includeArtists,
      onlySingles,
      includeLikes,
      includeComments,
      orderByColumn,
      orderByDirection,
      limit,
      offset,
    } = req.query;
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
      includeAlbums: includeAlbums === "true",
      includeArtists: includeArtists === "true",
      onlySingles: onlySingles === "true",
      includeLikes: includeLikes === "true",
      includeComments: includeComments === "true",
      orderByColumn: column as any,
      orderByDirection: direction as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json(songs);
  } catch (error: any) {
    console.error("Error in GET /artists/:id/songs:", error);
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
    return;
  }
});

// GET /api/artists/:id/albums
router.get(
  "/:id/albums",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        includeLikes,
        includeRuntime,
        includeSongCount,
        orderByColumn,
        orderByDirection,
        limit,
        offset,
      } = req.query;

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
      console.error("Error in GET /artists/:id/albums:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/artist-playlists
router.get(
  "/:id/artist-playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        includeUser,
        includeLikes,
        includeSongCount,
        includeRuntime,
        orderByColumn,
        orderByDirection,
        limit,
        offset,
      } = req.query;

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
          includeUser: includeUser === "true",
          includeLikes: includeLikes === "true",
          includeSongCount: includeSongCount === "true",
          includeRuntime: includeRuntime === "true",
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        }
      );

      res.status(200).json(artistPlaylists);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/artist-playlists:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/related
router.get(
  "/:id/related",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { includeUser, limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const relatedArtists = await ArtistRepository.getRelatedArtists(id, {
        includeUser: includeUser === "true",
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(relatedArtists);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/related:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/number-songs
router.get(
  "/:id/number-songs",
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
      console.error("Error in GET /artists/:id/number-songs:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/number-albums
router.get(
  "/:id/number-albums",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const numberOfAlbums = await ArtistRepository.getNumberOfAlbums(id);
      res.status(200).json({ numberOfAlbums });
    } catch (error: any) {
      console.error("Error in GET /artists/:id/number-albums:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/number-singles
router.get(
  "/:id/number-singles",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const numberOfSingles = await ArtistRepository.getNumberOfSingles(id);
      res.status(200).json({ numberOfSingles });
    } catch (error: any) {
      console.error("Error in GET /artists/:id/number-singles:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/streams
router.get(
  "/:id/streams",
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
      console.error("Error in GET /artists/:id/streams:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/followers
// pass in the USER id of the artist
//TODO this doenst really make sense here - it should be in users routes since followers are users, move later!!
router.get(
  "/:id/followers",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const followers = await FollowService.getFollowers(id, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.status(200).json(followers);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/followers:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/followers/count
router.get(
  "/:id/followers/count",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const followerCount = await FollowService.getFollowerCount(id);
      res.status(200).json({ followerCount });
    } catch (error: any) {
      console.error("Error in GET /artists/:id/follower-count:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/following
router.get(
  "/:id/following",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const following = await FollowService.getFollowing(id, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.status(200).json(following);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/following:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/following/count
router.get(
  "/:id/following/count",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const followingCount = await FollowService.getFollowingCount(id);
      res.status(200).json({ followingCount });
    } catch (error: any) {
      console.error("Error in GET /artists/:id/following-count:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/playlists
router.get(
  "/:id/playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { includeUser, limit, offset } = req.query;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const playlists = await ArtistRepository.getPlaylists(id, {
        includeUser: includeUser === "true",
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(playlists);
    } catch (error: any) {
      console.error("Error in GET /artists/:id/playlists:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/monthly-listeners
router.get(
  "/:id/monthly-listeners",
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
      console.error("Error in GET /artists/:id/monthly-listeners:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// GET /api/artists/:id/pin-album
router.post(
  "/:id/pin-album",
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

// GET /api/artists/:id/unpin-album
router.post(
  "/:id/pin-album",
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

// GET /api/artists/:id/has-artist-playlists
router.get(
  "/:id/has-artist-playlists",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const hasPlaylists = await ArtistRepository.checkArtistHasPlaylists(id);
      res.status(200).json({ hasPlaylists });
    } catch (error: any) {
      console.error("Error in GET /artists/:id/has-artist-playlists:", error);
      const errorMessage = error.message || "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
