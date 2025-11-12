import { useState, useEffect, useMemo, useCallback } from "react";

interface TextContrastResult {
  textColor: "white" | "black";
  loading: boolean;
}

const imageContrastCache = new Map<string, "white" | "black">();

/**
 * Hook that analyzes an image's brightness and returns appropriate text color
 * @param imageUrl - URL of the image to analyze
 * @returns Object containing textColor ("white" or "black") and loading state
 */
export const useTextContrast = (imageUrl?: string): TextContrastResult => {
  const [textColor, setTextColor] = useState<"white" | "black">("white");
  const [loading, setLoading] = useState(false);

  const analyzeImageBrightness = useCallback(
    (url: string): Promise<"white" | "black"> => {
      return new Promise((resolve, reject) => {
        if (imageContrastCache.has(url)) {
          resolve(imageContrastCache.get(url)!);
          return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Could not get canvas context"));
              return;
            }

            const maxSize = 100;
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const data = imageData.data;

            let totalBrightness = 0;
            let pixelCount = 0;

            for (let i = 0; i < data.length; i += 16) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const alpha = data[i + 3];

              if (alpha < 128) continue;

              const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
              totalBrightness += brightness;
              pixelCount++;
            }

            const averageBrightness = totalBrightness / pixelCount;
            const result = averageBrightness > 140 ? "black" : "white";

            imageContrastCache.set(url, result);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = url;
      });
    },
    []
  );

  const analyzeImage = useMemo(() => {
    if (!imageUrl) return null;
    return analyzeImageBrightness;
  }, [imageUrl, analyzeImageBrightness]);

  useEffect(() => {
    if (!imageUrl || !analyzeImage) {
      setTextColor("white");
      setLoading(false);
      return;
    }

    if (imageContrastCache.has(imageUrl)) {
      setTextColor(imageContrastCache.get(imageUrl)!);
      setLoading(false);
      return;
    }

    setLoading(true);

    analyzeImage(imageUrl)
      .then((result) => {
        setTextColor(result);
        setLoading(false);
      })
      .catch((error) => {
        console.warn("Failed to analyze image brightness:", error);
        setTextColor("white");
        setLoading(false);
      });
  }, [imageUrl, analyzeImage]);

  return { textColor, loading };
};
