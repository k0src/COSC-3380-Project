import { memo, useCallback, useMemo } from "react";
import { useAudioQueue } from "@contexts";
import type { Playlist } from "@types";
import { LuCirclePlay, LuCirclePause } from "react-icons/lu";
import styles from "./PlaylistPlayButton.module.css";
import classNames from "classnames";

export interface PlaylistPlayButtonProps {
  playlist: Playlist;
}

const PlaylistPlayButton: React.FC<PlaylistPlayButtonProps> = ({
  playlist,
}) => {
  const { state, actions } = useAudioQueue();
  const { queue, currentIndex, isPlaying } = state;

  const currentQueueItem = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= queue.length) {
      return null;
    }
    return queue[currentIndex];
  }, [currentIndex, queue]);

  const isPlaylistPlaying = useMemo(() => {
    if (!playlist.id || !currentQueueItem) return false;
    return (
      !currentQueueItem.isQueued &&
      currentQueueItem.sourceId === playlist.id &&
      currentQueueItem.sourceType === "playlist"
    );
  }, [playlist.id, currentQueueItem]);

  const handlePlayPause = useCallback(() => {
    if (!playlist) return;

    if (isPlaylistPlaying) {
      if (isPlaying) {
        actions.pause();
      } else {
        actions.resume();
      }
    } else {
      actions.play(playlist);
    }
  }, [playlist, isPlaylistPlaying, isPlaying, actions]);

  return (
    <button
      onClick={handlePlayPause}
      className={classNames(styles.playButton, {
        [styles.playButtonActive]: isPlaylistPlaying && isPlaying,
      })}
      disabled={!playlist.song_count || playlist.song_count === 0}
    >
      {isPlaylistPlaying && isPlaying ? <LuCirclePause /> : <LuCirclePlay />}
    </button>
  );
};

export default memo(PlaylistPlayButton);
