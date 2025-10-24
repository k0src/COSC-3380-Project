/**
 * Generates an array of waveform bar heights for audio waveform skeletons.
 * @param count Number of bars to generate.
 * @param minAmplitude The minimum height of the bars.
 * @param maxAmplitude The maximum height of the bars.
 * @returns Array of bar heights.
 */
export function generateWaveformBars(
  count: number = 80,
  minAmplitude: number = 20,
  maxAmplitude: number = 100
): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const fadeIn = 1 / (1 + Math.exp(-12 * (progress - 0.2)));
    const fadeOut = 1 / (1 + Math.exp(12 * (progress - 0.8)));
    const envelope = fadeIn * fadeOut * 1.1;
    const baseWave =
      Math.sin(i * 0.35) * 0.6 +
      Math.sin(i * 0.7 + Math.random() * 0.5) * 0.3 +
      Math.sin(i * 0.15) * 0.2;
    const noise = (Math.random() - 0.5) * 1.2;
    const signal = Math.abs(baseWave + noise);
    let height =
      minAmplitude + (maxAmplitude - minAmplitude) * envelope * signal;
    height = Math.min(maxAmplitude, Math.max(minAmplitude, height));
    bars.push(height);
  }
  return bars;
}
