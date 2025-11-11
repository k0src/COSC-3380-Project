import express, { Request, Response } from "express";
import { SongRepository } from "@repositories";
import { query } from "../config/database.js";
import multer from "multer";
import { uploadBlob } from "../config/blobStorage.js";
import crypto from "crypto";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Debug logging: show incoming request details to help troubleshoot 500 errors
      try {
        console.log("POST /api/songs incoming headers:", {
          origin: req.headers.origin,
          "content-type": req.headers["content-type"],
          "content-length": req.headers["content-length"],
        });
        console.log("req.body keys:", Object.keys(req.body || {}));
      } catch (logErr) {
        console.warn("Failed to log request meta:", logErr);
      }

      const file = (req as any).file as Express.Multer.File | undefined;
      // Log whether multer parsed a file
      console.log("multer file:", file ? { originalname: file.originalname, size: file.size } : null);
      const title = (req.body?.title || (file && file.originalname) || "Untitled").toString();

      if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // generate a UUID for the DB id and blob filename
      const id = crypto.randomUUID();
      const ext = (file.originalname.match(/\.[^.]+$/) || [""])[0];
      const blobName = `audio/${id}${ext}`;

      // upload to blob storage
      await uploadBlob(blobName, file.buffer);

  // insert DB record (provide required fields that have no defaults)
  // supply basic defaults for genre, duration and release_date to satisfy NOT NULL columns
  const sql = `INSERT INTO songs (id, title, audio_url, genre, duration, release_date, created_at) VALUES ($1,$2,$3,$4,$5,NOW()::date,NOW()) RETURNING *`;
  const rows = await query(sql, [id, title, blobName, 'Unknown', 0]);

      res.status(201).json(rows[0]);
    } catch (error) {
      // Log error and include request context
      try {
        console.error("Error in POST /songs:", error);
        console.error("Request headers:", {
          origin: req.headers.origin,
          "content-type": req.headers["content-type"],
          "content-length": req.headers["content-length"],
        });
        console.error("req.body (keys):", Object.keys(req.body || {}));
      } catch (logErr) {
        console.error("Error while logging failure context:", logErr);
      }
      res.status(500).json({ error: "Failed to upload song" });
    }
  }
);
