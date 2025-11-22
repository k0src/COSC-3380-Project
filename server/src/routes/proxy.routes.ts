import { Router } from "express";
import { getBlobUrl } from "@config/blobStorage.js";
import { handlePgError } from "@util";

const router = Router();

/* ========================================================================== */
/*                              Proxy Routes                                  */
/* ========================================================================== */

router.get("/audio/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const blobUrl = getBlobUrl(filename);
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
      "Access-Control-Expose-Headers":
        "Content-Length, Content-Range, Accept-Ranges",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    });

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    return;
  } catch (error: any) {
    console.error("Error proxying audio file:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
    return;
  }
});

export default router;
