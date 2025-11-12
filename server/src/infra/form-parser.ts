import { Request } from "express";
import Busboy from "busboy";
import { uploadBlob } from "@config/blobStorage";
import { v4 as uuidv4 } from "uuid";
import type { SongData } from "@types";
import { parseBuffer } from "music-metadata";
import { Readable } from "stream";

/**
 * Parses multipart/form-data request for song data and files.
 * Uploads files to blob storage and returns song data.
 * @param req - Express request object.
 * @returns Promise resolving to SongData.
 * @throws Error if required fields are missing or file upload fails.
 */
export function parseSongForm(
  req: Request,
  mode: "upload" | "update"
): Promise<SongData> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });

    const uploadPromises: Promise<void>[] = [];
    const songData: Partial<SongData> = {};

    // Normal fields go directly into songData
    busboy.on("field", (fieldname, value) => {
      if (["title", "genre", "release_date"].includes(fieldname)) {
        (songData as any)[fieldname] = value;
      }
    });

    // Files are uploaded to blob storage
    busboy.on("file", async (fieldname, file, info) => {
      const { filename, mimeType } = info;

      // Validate mimetype
      if (fieldname === "audio_url" && !mimeType.startsWith("audio/")) {
        file.resume();
        return reject(new Error("Invalid audio file type"));
      }
      if (fieldname === "image_url" && !mimeType.startsWith("image/")) {
        file.resume();
        return reject(new Error("Invalid image file type"));
      }

      // Give file a unique name
      const blobName = `${uuidv4()}-${filename}`;

      // For audio files calculate duration and upload
      if (fieldname === "audio_url") {
        const uploadPromise = (async () => {
          try {
            // Collect all chunks
            const chunks: Buffer[] = [];
            for await (const chunk of file) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            // Calculate duration from buffer
            const metadata = await parseBuffer(buffer, mimeType);
            const duration = metadata.format.duration
              ? Math.round(metadata.format.duration)
              : null;

            if (!duration) {
              throw new Error("Could not determine audio duration");
            }
            songData.duration = duration;

            // Upload buffer to blob storage
            const bufferStream = Readable.from(buffer);
            await uploadBlob(blobName, bufferStream);
            songData.audio_url = blobName;
          } catch (error) {
            return reject(error);
          }
        })();

        uploadPromises.push(uploadPromise);
      } else {
        // For image files just upload directly
        uploadPromises.push(
          uploadBlob(blobName, file).then(() => {
            if (fieldname === "image_url") {
              songData.image_url = blobName;
            }
          })
        );
      }
    });

    busboy.on("error", (error) => reject(error));
    busboy.on("finish", async () => {
      try {
        await Promise.all(uploadPromises);

        // Validate required fields if upload
        if (
          mode === "upload" &&
          (!songData.title ||
            !songData.genre ||
            !songData.duration ||
            !songData.audio_url)
        ) {
          return reject(new Error("Missing required song fields"));
        }

        resolve(songData as SongData);
      } catch (error) {
        return reject(error);
      }
    });

    req.pipe(busboy);
  });
}
