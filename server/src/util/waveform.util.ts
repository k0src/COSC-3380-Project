import { spawn } from "child_process";
import type { WaveformData } from "@types";
import fs from "fs";
import path from "path";
import os from "os";

export async function generateWaveform(
  audioBuffer: Buffer
): Promise<WaveformData | null> {
  let tempFilePath: string | null = null;

  try {
    tempFilePath = path.join(os.tmpdir(), `temp-audio-${Date.now()}.mp3`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    const ffmpeg = spawn("ffmpeg", [
      "-i",
      tempFilePath,
      "-f",
      "f32le",
      "-acodec",
      "pcm_f32le",
      "-ac",
      "2",
      "-ar",
      "44100",
      "pipe:1",
    ]);

    const chunks: Buffer[] = [];

    ffmpeg.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    ffmpeg.stderr.on("data", () => {});

    await new Promise<void>((resolve, reject) => {
      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });
      ffmpeg.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    const samples = new Float32Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.length / 4
    );
    const channels = 2;
    const samplesPerChannel = samples.length / channels;

    const targetPoints = 1000;
    const samplesPerPoint = Math.floor(samplesPerChannel / targetPoints);

    const leftChannel: number[] = [];
    const rightChannel: number[] = [];

    for (let i = 0; i < targetPoints; i++) {
      const start = i * samplesPerPoint * channels;
      let leftMax = 0;
      let rightMax = 0;

      for (let j = 0; j < samplesPerPoint; j++) {
        const idx = start + j * channels;
        if (idx < samples.length - 1) {
          const leftSample = samples[idx];
          const rightSample = samples[idx + 1];
          if (leftSample && rightSample) {
            leftMax = Math.max(leftMax, Math.abs(leftSample));
            rightMax = Math.max(rightMax, Math.abs(rightSample));
          }
        }
      }

      leftChannel.push(leftMax);
      rightChannel.push(rightMax);
    }

    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      tempFilePath,
    ]);

    let durationStr = "";
    ffprobe.stdout.on("data", (chunk: Buffer) => {
      durationStr += chunk.toString();
    });

    await new Promise<void>((resolve, reject) => {
      ffprobe.on("close", resolve);
      ffprobe.on("error", reject);
    });

    const duration = parseFloat(durationStr.trim());

    const waveformData: WaveformData = {
      peaks: [leftChannel, rightChannel],
      channels: 2,
      duration: duration,
    };

    console.log(
      `Waveform generated: ${
        waveformData.channels
      } channels, ${duration.toFixed(2)}s, ${leftChannel.length} points`
    );

    return waveformData;
  } catch (error) {
    console.error("Error generating waveform:", error);
    return null;
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }
  }
}
