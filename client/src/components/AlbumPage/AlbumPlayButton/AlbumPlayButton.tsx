import { memo, useCallback, useMemo } from "react";
import { useAudioQueue } from "@contexts";
import type { Album } from "@types";
import { LuCirclePlay, LuCirclePause } from "react-icons/lu";
import styles from "./AlbumPlayButton.module.css";
import classNames from "classnames";

export interface AlbumPlayButtonProps {
  album: Album;
}

const AlbumPlayButton: React.FC<AlbumPlayButtonProps> = ({ album }) => {
  const { state, actions } = useAudioQueue();
  const { queue, currentIndex, isPlaying } = state;

  const currentQueueItem = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= queue.length) {
      return null;
    }
    return queue[currentIndex];
  }, [currentIndex, queue]);

  const isAlbumPlaying = useMemo(() => {
    if (!album.id || !currentQueueItem) return false;
    return (
      !currentQueueItem.isQueued &&
      currentQueueItem.sourceId === album.id &&
      currentQueueItem.sourceType === "album"
    );
  }, [album.id, currentQueueItem]);

  const handlePlayPause = useCallback(() => {
    if (!album) return;

    if (isAlbumPlaying) {
      if (isPlaying) {
        actions.pause();
      } else {
        actions.resume();
      }
    } else {
      actions.play(album);
    }
  }, [album, isAlbumPlaying, isPlaying, actions]);

  return (
    <button
      onClick={handlePlayPause}
      className={classNames(styles.playButton, {
        [styles.playButtonActive]: isAlbumPlaying && isPlaying,
      })}
      disabled={!album.song_count || album.song_count === 0}
    >
      {isAlbumPlaying && isPlaying ? <LuCirclePause /> : <LuCirclePlay />}
    </button>
  );
};

export default memo(AlbumPlayButton);
