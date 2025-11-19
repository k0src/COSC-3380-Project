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

type FormEntityType = "user" | "playlist" | "song" | "album" | "artist";

interface FormEntityConfig {
  imageFields: string[];
  audioFields?: string[];
  blurhashMapping: { [key: string]: string };
}

const FORM_ENTITY_CONFIGS: Record<FormEntityType, FormEntityConfig> = {
  user: {
    imageFields: ["profile_picture_url"],
    blurhashMapping: { profile_picture_url: "pfp_blurhash" },
  },
  playlist: {
    imageFields: ["image_url"],
    blurhashMapping: { image_url: "image_url_blurhash" },
  },
  song: {
    imageFields: ["image_url"],
    audioFields: ["audio_url"],
    blurhashMapping: { image_url: "image_url_blurhash" },
  },
  album: {
    imageFields: ["image_url"],
    blurhashMapping: { image_url: "image_url_blurhash" },
  },
  artist: {
    imageFields: ["banner_image_url"],
    blurhashMapping: { banner_image_url: "banner_image_url_blurhash" },
  },
};

/**
 * Form parser for all entity types
 * @param req Express request object
 * @param formEntityType Type of entity being parsed
 * @returns Promise resolving to parsed form data
 */
export function parseForm(
  req: Request,
  formEntityType: FormEntityType
): Promise<any> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const config = FORM_ENTITY_CONFIGS[formEntityType];
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

      const isImageField = config.imageFields.includes(fieldname);
      const isAudioField = config.audioFields?.includes(fieldname);

      if (!isImageField && !isAudioField) {
        file.resume();
        return;
      }

      if (isImageField && !mimeType.startsWith("image/")) {
        file.resume();
        return reject(new Error("Invalid file type. Only images are allowed."));
      }

      if (isAudioField && !mimeType.startsWith("audio/")) {
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

      if (isImageField && !supportedImageTypes.includes(mimeType)) {
        file.resume();
        return reject(
          new Error(
            "Unsupported image format. Only JPEG, PNG, and WebP are allowed."
          )
        );
      }

      if (isAudioField && mimeType !== supportedAudioType) {
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
            if (totalSize > MAX_IMAGE_SIZE && isImageField) {
              throw new Error("Image file size exceeds 5MB limit.");
            }
            if (totalSize > MAX_AUDIO_SIZE && isAudioField) {
              throw new Error("Audio file size exceeds 10MB limit.");
            }
            chunks.push(chunk);
          }

          const buffer = Buffer.concat(chunks);

          if (isImageField) {
            const blurhash = await generateBlurhash(buffer);
            const blurhashField = config.blurhashMapping[fieldname];
            if (blurhashField) {
              formData[blurhashField] = blurhash;
            }
          }

          if (isAudioField) {
            const metadata = await parseBuffer(buffer, mimeType);
            const duration = metadata.format.duration
              ? Math.round(metadata.format.duration)
              : null;

            if (!duration) {
              throw new Error("Unable to determine audio duration.");
            }

            formData.duration = duration;
            formData._audioBuffer = buffer;
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

        config.imageFields.forEach((field) => {
          if (formData[field] === null) {
            const blurhashField = config.blurhashMapping[field];
            if (blurhashField) {
              formData[blurhashField] = null;
            }
          }
        });

        resolve(formData);
      } catch (error) {
        reject(error);
      }
    });

    req.pipe(busboy);
  });
}
