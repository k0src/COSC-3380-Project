import { Request } from "express";
import Busboy from "busboy";
import { uploadBlob } from "@config/blobStorage";
import { v4 as uuidv4 } from "uuid";
import { parseBuffer } from "music-metadata";
import { Readable } from "stream";
import { encode } from "blurhash";
import sharp from "sharp";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB in bytes

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

export function parseUserForm(req: Request): Promise<any> {
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

        if (formData.profile_picture_url === null) {
          formData.pfp_blurhash = null;
        }

        resolve(formData);
      } catch (error) {
        reject(error);
      }
    });

    req.pipe(busboy);
  });
}

export function parsePlaylistForm(req: Request): Promise<any> {
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

      if (fieldname !== "image_url") {
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
          formData.image_url_blurhash = blurhash;

          const bufferStream = Readable.from(buffer);
          await uploadBlob(blobName, bufferStream);
          formData.image_url = blobName;
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

        if (formData.image_url === null) {
          formData.image_url_blurhash = null;
        }

        resolve(formData);
      } catch (error) {
        reject(error);
      }
    });

    req.pipe(busboy);
  });
}

export function parseSongForm(req: Request): Promise<any> {
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

      if (fieldname !== "image_url" && fieldname !== "audio_url") {
        file.resume();
        return;
      }

      const isImage = fieldname === "image_url";
      const isAudio = fieldname === "audio_url";

      if (isImage && !mimeType.startsWith("image/")) {
        file.resume();
        return reject(new Error("Invalid file type. Only images are allowed."));
      }

      if (isAudio && !mimeType.startsWith("audio/")) {
        file.resume();
        return reject(
          new Error("Invalid file type. Only audio files are allowed.")
        );
      }

      const supportedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      const supportedAudioType = "audio/mpeg";

      if (isImage && !supportedImageTypes.includes(mimeType)) {
        file.resume();
        return reject(
          new Error(
            "Unsupported image format. Only JPEG, PNG, and WebP are allowed."
          )
        );
      }

      if (isAudio && mimeType !== supportedAudioType) {
        file.resume();
        return reject(
          new Error("Unsupported audio format. Only MP3 files are allowed.")
        );
      }

      const blobName = `${uuidv4()}-${filename}`;

      const uploadPromise = (async () => {
        try {
          const chunks: Buffer[] = [];
          let totalSize = 0;

          for await (const chunk of file) {
            totalSize += chunk.length;
            if (totalSize > MAX_IMAGE_SIZE && isImage) {
              throw new Error("Image file size exceeds 5MB limit.");
            }
            if (totalSize > MAX_AUDIO_SIZE && isAudio) {
              throw new Error("Audio file size exceeds 10MB limit.");
            }

            chunks.push(chunk);
          }

          const buffer = Buffer.concat(chunks);

          if (isImage) {
            const blurhash = await generateBlurhash(buffer);
            formData.image_url_blurhash = blurhash;
          }

          if (isAudio) {
            const metadata = await parseBuffer(buffer, mimeType);
            const duration = metadata.format.duration
              ? Math.round(metadata.format.duration)
              : null;

            if (!duration) {
              throw new Error("Unable to determine audio duration.");
            }

            formData.duration = duration;
          }

          const bufferStream = Readable.from(buffer);
          await uploadBlob(blobName, bufferStream);
          formData[fieldname] = blobName;
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

        if (formData.image_url === null) {
          formData.image_url_blurhash = null;
        }

        resolve(formData);
      } catch (error) {
        reject(error);
      }
    });

    req.pipe(busboy);
  });
}

export function parseAlbumForm(req: Request): Promise<any> {
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

      if (fieldname !== "image_url") {
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
          formData.image_url_blurhash = blurhash;

          const bufferStream = Readable.from(buffer);
          await uploadBlob(blobName, bufferStream);
          formData.image_url = blobName;
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

        if (formData.image_url === null) {
          formData.image_url_blurhash = null;
        }

        resolve(formData);
      } catch (error) {
        reject(error);
      }
    });

    req.pipe(busboy);
  });
}

export function parseArtistForm(req: Request): Promise<any> {
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

      if (fieldname !== "banner_image") {
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
          formData.banner_image_url_blurhash = blurhash;

          const bufferStream = Readable.from(buffer);
          await uploadBlob(blobName, bufferStream);
          formData.banner_image_url = blobName;
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

        if (formData.banner_image_url === null) {
          formData.banner_image_url_blurhash = null;
        }

        resolve(formData);
      } catch (error) {
        reject(error);
      }
    });

    req.pipe(busboy);
  });
}
