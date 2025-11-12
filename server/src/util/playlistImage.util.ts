import sharp from "sharp";
import https from "https";
import http from "http";

const imageCache = new Map<string, Buffer>();

interface PlaylistImageOptions {
  playlistId: string;
  songImageUrls: string[];
  size?: number;
}

/**
 * Downloads an image from a URL and returns it as a Buffer
 * @param url The URL of the image to download
 * @returns Promise that resolves to the image Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];

        response.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Generates a playlist cover image from song covers
 * @param options Options for generating the playlist image
 * @param options.playlistId The ID of the playlist
 * @param options.songImageUrls Array of song image URLs
 * @param options.size Size of the final image (default: 640px)
 * @returns Promise that resolves to the generated image Buffer
 */
export async function generatePlaylistImage(
  options: PlaylistImageOptions
): Promise<Buffer> {
  const { playlistId, songImageUrls, size = 640 } = options;

  const baseUrls = songImageUrls.map((url) => url.split("?")[0]);
  const sortedUrls = [...baseUrls].sort();
  const cacheKey = `${playlistId}:${sortedUrls.join(",")}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  if (!songImageUrls || songImageUrls.length === 0) {
    throw new Error("At least one song image URL is required");
  }

  try {
    let compositeImage: Buffer;

    if (songImageUrls.length < 4) {
      const imageBuffer = await downloadImage(songImageUrls[0]!);
      compositeImage = await sharp(imageBuffer)
        .resize(size, size, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 90 })
        .toBuffer();
    } else {
      const imageUrls = songImageUrls.slice(0, 4);
      const halfSize = size / 2;

      const imageBuffers = await Promise.all(
        imageUrls.map((url) => downloadImage(url))
      );

      const resizedImages = await Promise.all(
        imageBuffers.map((buffer) =>
          sharp(buffer)
            .resize(halfSize, halfSize, {
              fit: "cover",
              position: "center",
            })
            .toBuffer()
        )
      );

      compositeImage = await sharp({
        create: {
          width: size,
          height: size,
          channels: 3,
          background: { r: 0, g: 0, b: 0 },
        },
      })
        .composite([
          { input: resizedImages[0], top: 0, left: 0 },
          { input: resizedImages[1], top: 0, left: halfSize },
          { input: resizedImages[2], top: halfSize, left: 0 },
          { input: resizedImages[3], top: halfSize, left: halfSize },
        ])
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    imageCache.set(cacheKey, compositeImage);
    if (imageCache.size > 1000) {
      const firstKey = imageCache.keys().next().value;
      if (firstKey) {
        imageCache.delete(firstKey);
      }
    }

    return compositeImage;
  } catch (error) {
    console.error("Error generating playlist image:", error);
    throw new Error("Failed to generate playlist image");
  }
}

/**
 * Clears the playlist image cache
 */
export const clearImageCache = async () => imageCache.clear();
