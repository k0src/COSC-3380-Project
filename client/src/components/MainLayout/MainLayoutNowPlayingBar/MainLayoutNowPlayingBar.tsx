import React, { useState, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { formatPlaybackTime } from "@util";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime] = useState(38);
  const [duration] = useState(181);

  // const { user, isAuthenticated } = useAuth();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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

  const handleToggleShuffle = useCallback(
    () => setIsShuffle((prev) => !prev),
    []
  );
  const handleToggleRepeat = useCallback(
    () => setIsRepeat((prev) => !prev),
    []
  );
  const handleTogglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVolume(Number(e.target.value));
    },
    []
  );

  return (
    <div className={styles.nowPlayingBar}>
      <div className={styles.nowPlayingInfo}>
        <img
          src={musicPlaceholder}
          alt="Album Art"
          className={styles.albumArt}
        />
        <div className={styles.songInfo}>
          <Link to="/artist/123" className={styles.artistName}>
            Artist Name
          </Link>
          <Link to="/song/123" className={styles.songTitle}>
            Song Title
          </Link>
        </div>
      </div>

      <div className={styles.playerControls}>
        <div className={styles.controlButtons}>
          <button
            className={classNames(styles.controlButton, styles.shuffleButton, {
              [styles.controlButtonActive]: isShuffle,
            })}
            onClick={handleToggleShuffle}
            aria-label={isShuffle ? "Disable Shuffle" : "Enable Shuffle"}
          >
            <LuShuffle />
          </button>
          <button className={styles.controlButton} aria-label="Previous Track">
            <LuSkipBack />
          </button>
          <button
            className={classNames(styles.controlButton, styles.playButton, {
              [styles.playButtonActive]: isPlaying,
            })}
            onClick={handleTogglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <LuCirclePause /> : <LuCirclePlay />}
          </button>
          <button className={styles.controlButton} aria-label="Next Track">
            <LuSkipForward />
          </button>
          <button
            className={classNames(styles.controlButton, styles.repeatButton, {
              [styles.controlButtonActive]: isRepeat,
            })}
            onClick={handleToggleRepeat}
            aria-label={isRepeat ? "Disable Repeat" : "Enable Repeat"}
          >
            <LuRepeat />
          </button>
        </div>
        <div className={styles.progressContainer}>
          <span className={styles.timeLabel}>
            {formatPlaybackTime(currentTime)}
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              className={styles.progressSlider}
              disabled
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
            value={volume}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
            style={{ "--volume-percent": `${volume}%` } as React.CSSProperties}
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
