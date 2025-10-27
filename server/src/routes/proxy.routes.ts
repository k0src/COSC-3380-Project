import { Router } from "express";
import { getBlobUrl } from "../config/blobStorage.js";

const router = Router();

router.get("/audio/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`Proxy request for filename: ${filename}`);
    const blobUrl = getBlobUrl(filename);
    console.log(`Generated blob URL: ${blobUrl}`);
    const response = await fetch(blobUrl);

    if (!response.ok) {
      return res.status(404).json({ error: "Audio file not found" });
    }
    res.set({
      "Content-Type": response.headers.get("content-type") || "audio/mpeg",
      "Content-Length": response.headers.get("content-length"),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    });

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    return;
  } catch (error) {
    console.error("Error proxying audio file:", error);
    res.status(500).json({ error: "Failed to load audio file" });
    return;
  }
});

export default router;
