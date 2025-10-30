import { useMemo, useCallback, memo, useState } from "react";
import { useStreamTracking } from "@hooks";
import { WaveformPlayer, CoverLightbox } from "@components";
import type { Song, CoverGradient, SongArtist } from "@types";
import { useAudioQueue } from "@contexts";
import { LuPlay, LuThumbsUp, LuMessageSquareText } from "react-icons/lu";
import styles from "./SongContainer.module.css";
import musicPlaceholder from "@assets/music-placeholder.png";

export interface SongContainerProps {
  coverGradient: CoverGradient;
  song: Song;
  mainArtist: SongArtist | undefined;
  numberComments?: number;
}

const SongContainer: React.FC<SongContainerProps> = ({
  coverGradient,
  song,
  mainArtist,
  numberComments,
}) => {
  const { actions } = useAudioQueue();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  useStreamTracking();

  const gradientStyle = useMemo(
    () =>
      ({
        "--cover-gradient-color1": `rgba(${coverGradient.color1.r}, ${coverGradient.color1.g}, ${coverGradient.color1.b}, 0.2)`,
        "--cover-gradient-color2": `rgba(${coverGradient.color2.r}, ${coverGradient.color2.g}, ${coverGradient.color2.b}, 0.2)`,
      } as React.CSSProperties),
    [coverGradient]
  );

  const InteractionStat = memo(
    ({ icon: Icon, value }: { icon: React.ElementType; value: number }) => (
      <div className={styles.interactionStat}>
        <Icon />
        <span className={styles.interactionText}>{value}</span>
      </div>
    )
  );

  const handlePlay = useCallback(() => {
    actions.play(song);
  }, [actions, song]);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  return (
    <div className={styles.songContainer} style={gradientStyle}>
      <img
        src={song.image_url || musicPlaceholder}
        alt={`${song.title} Cover`}
        className={styles.coverImage}
        loading="lazy"
        onClick={handleImageClick}
      />
      <div className={styles.songRight}>
        <div className={styles.songInfoContainer}>
          <span className={styles.artistName}>{mainArtist?.display_name}</span>
          <span className={styles.songTitle}>{song.title}</span>
          <div className={styles.interactionsContainer}>
            <div className={styles.interactionsContainer}>
              <InteractionStat icon={LuPlay} value={song.streams ?? 0} />
              <InteractionStat icon={LuThumbsUp} value={song.likes ?? 0} />
              <InteractionStat
                icon={LuMessageSquareText}
                value={numberComments ?? 0}
              />
            </div>
          </div>
        </div>
        {song.audio_url && (
          <WaveformPlayer
            audioSrc={song.audio_url}
            captureKeyboard={false}
            onPlay={handlePlay}
          />
        )}
      </div>

      {song.image_url && (
        <CoverLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageUrl={song.image_url}
          altText={`${song.title} Cover`}
        />
      )}
    </div>
  );
};

export default SongContainer;
