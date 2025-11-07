import { memo } from "react";
import styles from "./SoundVisualizer.module.css";

const BAR_COUNT = 3;

interface SoundVisualizerProps {
  isPlaying: boolean;
  color?: string;
}

const SoundVisualizer: React.FC<SoundVisualizerProps> = ({
  isPlaying,
  color = "#d53131",
}) => {
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => i);

  return (
    <div className={styles.soundContainer}>
      {bars.map((index) => (
        <div
          key={`bar-${index}`}
          className={`${styles.bar} ${
            isPlaying ? styles.barAnimated : styles.barPaused
          }`}
          style={
            {
              "--bar-color": color,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

export default memo(SoundVisualizer);
