import express, { Request, Response } from "express";
import { SongRepository } from "@repositories";
import { query } from "../config/database.js";
import multer from "multer";
import { uploadBlob } from "../config/blobStorage.js";
import crypto from "crypto";

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

// GET /api/songs
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const songs = await query("SELECT * FROM songs ORDER BY created_at DESC LIMIT 200");
    res.status(200).json(songs);
  } catch (error) {
    console.error("Error in GET /songs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/songs/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "Song ID is required" });
    return;
  }

  try {
    const song = await SongRepository.getById(id);

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

export default router;

// POST /api/songs - upload a song file and create a DB record
router.post(
  "/",
  // accept one audio file (field 'file') and an optional cover image (field 'cover')
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
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

      // upload audio to blob storage
      await uploadBlob(audioBlobName, file.buffer);

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
        await uploadBlob(imageBlobName, cover.buffer);
      }

      // use provided genre/duration if present, otherwise sensible defaults
      const genreVal = (req.body?.genre || "Unknown").toString();
      const durationVal = Number(req.body?.duration) || 0;

      // insert DB record (provide required fields that have no defaults)
      const sql = `INSERT INTO songs (id, title, audio_url, image_url, genre, duration, release_date, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW()::date,NOW()) RETURNING *`;
      const rows = await query(sql, [id, title, audioBlobName, imageBlobName, genreVal, durationVal]);

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Error in POST /songs:", error);
      res.status(500).json({ error: "Failed to upload song" });
    }
  }
);
