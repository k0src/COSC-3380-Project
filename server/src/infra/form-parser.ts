import { Request } from "express";
import Busboy from "busboy";
import { uploadBlob } from "@config/blobStorage";
import { v4 as uuidv4 } from "uuid";
import type { SongData } from "@types";
import { parseBuffer } from "music-metadata";
import { Readable } from "stream";
import { encode } from "blurhash";
import sharp from "sharp";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Generates a blurhash from an image buffer
 * @param buffer Image buffer
 * @returns Promise resolving to blurhash string
 */
async function generateBlurhash(buffer: Buffer): Promise<string> {
  try {
    const { data, info } = await sharp(buffer)
      .resize(32, 32, { fit: "cover" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  } catch (error) {
    console.error("Error generating blurhash:", error);
    throw new Error("Failed to generate blurhash");
  }
}

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

/**
 * Parses multipart/form-data request for user update with optional image upload.
 * Handles regular form fields and uploads images to blob storage.
 * @param req Express request object.
 * @returns Promise resolving to parsed form data with uploaded image blob name.
 * @throws Error if image is invalid, too large, or upload fails.
 */
export function parseUserUpdateForm(req: Request): Promise<any> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });

    const formData: any = {};
    const uploadPromises: Promise<void>[] = [];

    busboy.on("field", (fieldname, value) => {
      if (value === "null") {
        formData[fieldname] = null;
      } else {
        formData[fieldname] = value;
      }
    });

    busboy.on("file", async (fieldname, file, info) => {
      const { filename, mimeType } = info;

      if (fieldname !== "profile_picture") {
        file.resume();
        return;
      }

      if (!mimeType.startsWith("image/")) {
        file.resume();
        return reject(new Error("Invalid file type. Only images are allowed."));
      }

      const supportedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!supportedTypes.includes(mimeType)) {
        file.resume();
        return reject(
          new Error(
            "Unsupported image format. Only JPEG, PNG, and WebP are allowed."
          )
        );
      }

      const blobName = `${uuidv4()}-${filename}`;

      const uploadPromise = (async () => {
        try {
          const chunks: Buffer[] = [];
          let totalSize = 0;

          for await (const chunk of file) {
            totalSize += chunk.length;
            if (totalSize > MAX_IMAGE_SIZE) {
              throw new Error("Image file size exceeds 5MB limit.");
            }

            chunks.push(chunk);
          }

          const buffer = Buffer.concat(chunks);

          const blurhash = await generateBlurhash(buffer);
          formData.pfp_blurhash = blurhash;

          const bufferStream = Readable.from(buffer);
          await uploadBlob(blobName, bufferStream);
          formData.profile_picture_url = blobName;
        } catch (error) {
          throw error;
        }
      })();

      uploadPromises.push(uploadPromise);
    });

    busboy.on("error", (error) => reject(error));

    busboy.on("finish", async () => {
      try {
        await Promise.all(uploadPromises);
        resolve(formData);
      } catch (error) {
        reject(error);
      }
    });

    req.pipe(busboy);
  });
}
