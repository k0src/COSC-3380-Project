import express, { Request, Response } from "express";
import { SongRepository as SongRepo } from "@repositories";
import { parseSongForm } from "@infra/form-parser";
import getCoverGradient from "@util/colors.util";
import { CommentService, StatsService, LikeService } from "@services";
import { validateOrderBy } from "@validators";
import { query } from "../config/database";
import multer from "multer";
import { uploadBlob, getBlobUrl } from "../config/blobStorage";
import crypto from "crypto";
import { parseBuffer } from "music-metadata";
import { authenticateToken } from "@middleware/auth.middleware";

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { 
    fileSize: 10 * 1024 * 1024,  // 10 MB for audio files
    files: 2  // max 2 files (audio + cover)
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'file') {
      const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/x-wav', 'audio/mp3'];
      const isValid = audioTypes.includes(file.mimetype) || /\.(mp3|wav|flac|ogg)$/i.test(file.originalname);
      cb(null, isValid);
      if (!isValid) cb(new Error('Invalid audio file type'));
    } else if (file.fieldname === 'cover') {
      const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const isValid = imageTypes.includes(file.mimetype) || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.originalname);
      cb(null, isValid);
      if (!isValid) cb(new Error('Invalid cover image type'));
    } else {
      cb(new Error('Unexpected field: ' + file.fieldname));
    }
  }
});

// Utility function to convert blob storage paths to accessible URLs
function convertBlobPaths(song: any) {
  if (!song) return song;
  
  // Convert audio_url if it's a blob storage path
  if (song.audio_url && song.audio_url.startsWith('audio/')) {
    try {
      song.audio_url = getBlobUrl(song.audio_url);
    } catch (error) {
      console.warn(`Failed to generate SAS URL for audio: ${song.audio_url}`, error);
    }
  }
  
  // Convert image_url if it's a blob storage path
  if (song.image_url && song.image_url.startsWith('image/')) {
    try {
      song.image_url = getBlobUrl(song.image_url);
    } catch (error) {
      console.warn(`Failed to generate SAS URL for image: ${song.image_url}`, error);
    }
  }
  
  return song;
}

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

    // Convert blob storage paths to accessible URLs
    const songsWithUrls = songs.map(convertBlobPaths);

    res.status(200).json(songsWithUrls);
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

    // Convert blob storage paths to accessible URLs
    const songWithUrls = convertBlobPaths(song);

    res.status(200).json(songWithUrls);
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

      // Convert blob storage paths to accessible URLs
      const suggestionsWithUrls = suggestions.map(convertBlobPaths);

      res.status(200).json(suggestionsWithUrls);
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

// POST /api/songs - upload a song file and create a DB record
// Protected: Requires authentication
router.post(
  "/",
  authenticateToken,
  // accept one audio file (field 'file') and an optional cover image (field 'cover')
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Get user ID from auth middleware (authenticateToken sets req.userId)
      const userId = (req as any).userId;
      
      const files = (req as any).files as { [field: string]: Express.Multer.File[] } | undefined;
      const file = files?.file?.[0];
      const cover = files?.cover?.[0];

      console.log("Upload request - Audio:", file?.originalname, "Cover:", cover?.originalname);

      const title = (req.body?.title || (file && file.originalname) || "Untitled").toString();

      if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // generate a UUID for the DB id and blob filename
      const id = crypto.randomUUID();

      const audioExt = (file.originalname.match(/\.[^.]+$/) || [""])[0];
      const audioBlobName = `audio/${id}${audioExt}`;

      // Validate file size before uploading
      if (file.size < 1000) {
        res.status(400).json({ error: "Audio file is too small or corrupted." });
        return;
      }

      // upload audio to blob storage
      console.log(`Uploading audio file: ${audioBlobName}, size: ${file.size} bytes`);
      await uploadBlob(audioBlobName, file.buffer);
      console.log(`Audio upload completed: ${audioBlobName}`);

      // handle optional cover image
      let imageBlobName: string | null = null;
      if (cover) {
        // Additional size check for cover images (5 MB limit)
        const maxCoverSize = 5 * 1024 * 1024;
        if (cover.size > maxCoverSize) {
          res.status(400).json({ error: "Cover image is too large. Maximum size is 5 MB." });
          return;
        }
        
        const imgExt = (cover.originalname.match(/\.[^.]+$/) || [""])[0];
        imageBlobName = `image/${id}${imgExt}`;
        console.log(`Uploading cover image: ${imageBlobName}, size: ${cover.size} bytes`);
        await uploadBlob(imageBlobName, cover.buffer);
        console.log(`Cover upload completed: ${imageBlobName}`);
      }

      // use provided genre/duration if present, otherwise sensible defaults
      const genreVal = (req.body?.genre || "Unknown").toString();
      let durationVal = Number(req.body?.duration) || 0;
      
      // If duration is 0 or invalid, try to extract from file metadata
      if (durationVal <= 0) {
        console.log("Duration not provided or invalid, attempting to extract from metadata");
        try {
          const metadata = await parseBuffer(file.buffer, file.mimetype);
          if (metadata.format.duration) {
            durationVal = Math.round(metadata.format.duration);
            console.log(`Extracted duration from metadata: ${durationVal} seconds`);
          } else {
            console.warn(`Could not extract duration from metadata for: ${title}`);
          }
        } catch (metaError) {
          console.warn(`Failed to parse metadata for ${title}:`, metaError instanceof Error ? metaError.message : String(metaError));
        }
      }
      
      console.log(`Creating DB record: title="${title}", duration=${durationVal}, genre="${genreVal}"`);

      // insert DB record with artist_id if user is authenticated
      let sql: string;
      let params: any[];
      
      if (userId) {
        // Get the user's artist_id from the users table
        const userRows = await query(`SELECT artist_id FROM users WHERE id = $1`, [userId]);
        const artistId = userRows.length > 0 ? userRows[0].artist_id : null;
        
        // If user is authenticated, associate the song with them as the main artist
        sql = `INSERT INTO songs (id, title, audio_url, image_url, genre, duration, release_date, created_at) 
               VALUES ($1,$2,$3,$4,$5,$6,NOW()::date,NOW()) RETURNING *`;
        params = [id, title, audioBlobName, imageBlobName, genreVal, durationVal];
        
        // Then insert into song_artists table with the artist_id
        const songRows = await query(sql, params);
        if (songRows.length > 0 && artistId) {
          const artistSql = `INSERT INTO song_artists (song_id, artist_id, role) VALUES ($1, $2, 'Main')`;
          await query(artistSql, [id, artistId]);
          console.log(`Song linked to artist: ${artistId}`);
        }
        
        const rows = await query(`SELECT * FROM songs WHERE id = $1`, [id]);
        res.status(201).json(rows[0]);
      } else {
        // If no user, just create the song without artist
        sql = `INSERT INTO songs (id, title, audio_url, image_url, genre, duration, release_date, created_at) 
               VALUES ($1,$2,$3,$4,$5,$6,NOW()::date,NOW()) RETURNING *`;
        params = [id, title, audioBlobName, imageBlobName, genreVal, durationVal];
        const rows = await query(sql, params);
        res.status(201).json(rows[0]);
      }
    } catch (error) {
      console.error("Error in POST /songs:", error);
      res.status(500).json({ error: "Failed to upload song" });
    }
  }
);

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
