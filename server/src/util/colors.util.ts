import sharp from "sharp";
import type { CoverGradient, RGB, HSL } from "@types";

const redFallback: RGB = { r: 8, g: 8, b: 8 };
const blackFallback: RGB = { r: 213, g: 49, b: 49 };

export default async function getCoverGradient(
  blobUrl: string
): Promise<CoverGradient> {
  try {
    if (!blobUrl || typeof blobUrl !== "string") {
      throw new Error("Invalid blob URL");
    }

    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const colors = await getColorsFromImage(buffer);
    const [color1, color2] = findVibrantColors(colors);

    return {
      color1,
      color2,
    };
  } catch (error) {
    console.error("Error getting gradient colors:", error);
    return {
      color1: redFallback,
      color2: blackFallback,
    };
  }
}

async function getColorsFromImage(buffer: Buffer): Promise<RGB[]> {
  const { data, info } = await sharp(buffer)
    .resize(100, 100, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const colors: RGB[] = [];
  for (let i = 0; i < data.length; i += info.channels * 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;

    const brightness = (r + g + b) / 3;
    if (brightness >= 20 && brightness <= 235) {
      colors.push({ r, g, b });
    }
  }

  return colors;
}

function findVibrantColors(colors: RGB[]): [RGB, RGB] {
  if (colors.length === 0) {
    return [redFallback, blackFallback];
  }

  const vibrantColors = colors
    .map((rgb) => ({ rgb, hsl: rgbToHsl(rgb) }))
    .filter((c) => c.hsl.s > 0.3 && c.hsl.l > 0.2 && c.hsl.l < 0.8)
    .sort((a, b) => b.hsl.s - a.hsl.s);

  if (vibrantColors.length === 0) {
    return [
      colors[0] ?? redFallback,
      colors[Math.floor(colors.length / 2)] ?? blackFallback,
    ];
  }

  const firstColor = vibrantColors[0];
  let secondColor = vibrantColors[1];

  if (!firstColor) {
    return [redFallback, blackFallback];
  }

  for (let i = 1; i < vibrantColors.length; i++) {
    const candidateColor = vibrantColors[i];
    if (!candidateColor) continue;
    const hueDiff = Math.abs(candidateColor.hsl.h - firstColor.hsl.h);
    const adjustedHueDiff = Math.min(hueDiff, 360 - hueDiff);
    if (adjustedHueDiff > 30) {
      secondColor = candidateColor;
      break;
    }
  }

  return [firstColor.rgb, secondColor?.rgb ?? firstColor.rgb];
}

const rgbToHsl = (rgb: RGB): HSL => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s, l };
};
