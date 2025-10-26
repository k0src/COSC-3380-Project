import React, { useState, memo, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useAudioQueue } from "@contexts";
import { formatPlaybackTime, getMainArtist } from "@util";
import classNames from "classnames";
import styles from "./MainLayoutNowPlayingBar.module.css";
import {
  LuCirclePlay,
  LuCirclePause,
  LuRepeat,
  LuSkipBack,
  LuSkipForward,
  LuShuffle,
  LuVolume2,
  LuThumbsUp,
  LuListPlus,
  LuShare,
} from "react-icons/lu";
import musicPlaceholder from "@assets/music-placeholder.png";

const NowPlayingBar: React.FC = () => {
  const [isLiked, setIsLiked] = useState(false);

  const { isAuthenticated } = useAuth();
  const { state, actions } = useAudioQueue();
  const navigate = useNavigate();

  const {
    isPlaying,
    currentSong,
    progress,
    duration,
    volume,
    repeatMode,
    hasNextSong,
    hasPreviousSong,
    isLoading,
    isShuffled,
  } = state;

  const handleToggleLike = useCallback(async () => {
    try {
      if (isAuthenticated) {
        setIsLiked((prev) => !prev);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Toggling like failed:", error);
    }
  }, [isAuthenticated, navigate]);

  const handleAddToPlaylist = useCallback(async () => {
    try {
      if (isAuthenticated) {
        console.log("added to playlist");
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding to playlist failed:", error);
    }
  }, [isAuthenticated, navigate]);

  const handleToggleShuffle = useCallback(() => {
    actions.toggleShuffleQueue();
  }, [actions]);

  const handleToggleRepeat = useCallback(() => {
    actions.toggleRepeatMode();
  }, [actions]);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      actions.pause();
    } else {
      actions.resume();
    }
  }, [isPlaying, actions]);

  const handleNext = useCallback(() => {
    if (hasNextSong) {
      actions.next();
    }
  }, [hasNextSong, actions]);

  const handlePrevious = useCallback(() => {
    if (hasPreviousSong) {
      actions.previous();
    }
  }, [hasPreviousSong, actions]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = Number(e.target.value);
      actions.seek(newTime);
    },
    [actions]
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = Number(e.target.value) / 100;
      actions.setVolume(newVolume);
    },
    [actions]
  );

  const mainArtist = useMemo(() => {
    if (isLoading || !currentSong)
      return { id: "", display_name: "Unknown Artist" };
    return (
      getMainArtist(currentSong.artists ?? []) ?? {
        id: "",
        display_name: "Unknown Artist",
      }
    );
  }, [isLoading, currentSong]);

  return (
    <div className={styles.nowPlayingBar}>
      <div className={styles.nowPlayingInfo}>
        <img
          src={currentSong?.image_url || musicPlaceholder}
          alt={`${currentSong?.title} album art`}
          className={styles.albumArt}
        />
        <div className={styles.songInfo}>
          {mainArtist.id ? (
            <Link to={`/artist/${mainArtist.id}`} className={styles.artistName}>
              {mainArtist.display_name || "Unknown Artist"}
            </Link>
          ) : (
            <span className={styles.artistName}>
              {mainArtist.display_name || "Unknown Artist"}
            </span>
          )}
          <Link to={`/song/${currentSong?.id}`} className={styles.songTitle}>
            {currentSong?.title}
          </Link>
        </div>
      </div>

      <div className={styles.playerControls}>
        <div className={styles.controlButtons}>
          <button
            className={classNames(styles.controlButton, styles.shuffleButton, {
              [styles.controlButtonActive]: isShuffled,
            })}
            onClick={handleToggleShuffle}
            aria-label={isShuffled ? "Disable Shuffle" : "Enable Shuffle"}
            disabled={isLoading}
          >
            <LuShuffle />
          </button>
          <button
            className={classNames(styles.controlButton, {
              [styles.controlButtonDisabled]: !hasPreviousSong,
            })}
            onClick={handlePrevious}
            disabled={!hasPreviousSong || isLoading}
            aria-label="Previous Track"
          >
            <LuSkipBack />
          </button>
          <button
            className={classNames(styles.controlButton, styles.playButton, {
              [styles.playButtonActive]: isPlaying,
            })}
            onClick={handleTogglePlay}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <LuCirclePause /> : <LuCirclePlay />}
          </button>
          <button
            className={classNames(styles.controlButton, {
              [styles.controlButtonDisabled]: !hasNextSong,
            })}
            onClick={handleNext}
            disabled={!hasNextSong || isLoading}
            aria-label="Next Track"
          >
            <LuSkipForward />
          </button>
          <button
            className={classNames(styles.controlButton, styles.repeatButton, {
              [styles.controlButtonActive]: repeatMode !== "none",
            })}
            onClick={handleToggleRepeat}
            disabled={isLoading}
            aria-label={
              repeatMode === "none"
                ? "Enable Repeat"
                : repeatMode === "one"
                ? "Repeat One"
                : "Repeat All"
            }
          >
            <LuRepeat />
            {repeatMode === "one" && (
              <span className={styles.repeatIndicator}>1</span>
            )}
          </button>
        </div>
        <div className={styles.progressContainer}>
          <span className={styles.timeLabel}>
            {formatPlaybackTime(progress)}
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
              }}
            />
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className={styles.progressSlider}
              disabled={isLoading || duration === 0}
              aria-label="Seek position"
            />
          </div>
          <span className={styles.timeLabel}>
            {formatPlaybackTime(duration)}
          </span>
        </div>
      </div>

      <div className={styles.rightControls}>
        <button
          className={classNames(styles.controlButton, {
            [styles.controlButtonActive]: isLiked,
          })}
          onClick={handleToggleLike}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <LuThumbsUp />
        </button>
        <button
          className={classNames(styles.controlButton, styles.playlistButton)}
          onClick={handleAddToPlaylist}
          aria-label="Add to Playlist"
        >
          <LuListPlus />
        </button>
        <div className={styles.volumeControl}>
          <LuVolume2 className={styles.volumeIcon} />
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
            disabled={isLoading}
            aria-label="Volume control"
            style={
              {
                "--volume-percent": `${Math.round(volume * 100)}%`,
              } as React.CSSProperties
            }
          />
        </div>
        <button
          className={classNames(styles.controlButton, styles.shareButton)}
          aria-label="Share"
        >
          <LuShare />
        </button>
      </div>
    </div>
  );
};

export default memo(NowPlayingBar);
