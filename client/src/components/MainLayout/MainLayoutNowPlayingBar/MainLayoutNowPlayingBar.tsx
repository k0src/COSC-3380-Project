import React, {
  useState,
  useEffect,
  memo,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLikeStatus, useStreamTracking, useKeyboardShortcuts } from "@hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, useAudioQueue } from "@contexts";
import { formatPlaybackTime, getMainArtist } from "@util";
import {
  ShareModal,
  CoverLightbox,
  KeyboardShortcutsModal,
  LazyImg,
} from "@components";
import { QueueManager } from "@components";
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
  LuListEnd,
} from "react-icons/lu";
import musicPlaceholder from "@assets/music-placeholder.webp";

const NowPlayingBar: React.FC = () => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isQueueManagerOpen, setIsQueueManagerOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const queueButtonRef = useRef<HTMLButtonElement>(null);
  const volumeControlRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated } = useAuth();
  const { state, actions } = useAudioQueue();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useStreamTracking();

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

  const {
    isLiked,
    toggleLike,
    isLoading: isLikeLoading,
  } = useLikeStatus({
    userId: user?.id || "",
    entityId: currentSong?.id || "",
    entityType: "song",
    isAuthenticated,
  });

  useEffect(() => {
    if (user?.id && currentSong?.id) {
      queryClient.invalidateQueries({
        queryKey: ["likeStatus", user.id, currentSong.id, "song"],
      });
    }
  }, [user?.id, currentSong?.id]);

  const handleToggleLike = useCallback(async () => {
    try {
      if (!isAuthenticated) return navigate("/login");
      if (!currentSong) return;
      await toggleLike();
    } catch (error) {
      console.error("Toggling like failed:", error);
    }
  }, [isAuthenticated, navigate]);

  //! add to playlist
  const handleAddToPlaylist = useCallback(async () => {
    try {
      if (!currentSong) return;
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

  const handleVolumeWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newVolume = Math.max(0, Math.min(1, volume + delta));
      actions.setVolume(newVolume);
    },
    [volume, actions]
  );

  useEffect(() => {
    const volumeControl = volumeControlRef.current;
    if (!volumeControl) return;

    volumeControl.addEventListener("wheel", handleVolumeWheel, {
      passive: false,
    });
    return () => volumeControl.removeEventListener("wheel", handleVolumeWheel);
  }, [handleVolumeWheel]);

  const handleShare = useCallback(() => {
    if (!currentSong) return;
    setIsShareModalOpen(true);
  }, []);

  const handleManageQueue = useCallback(() => {
    setIsQueueManagerOpen((prev) => !prev);
  }, []);

  const handleOpenLightBox = useCallback(() => {
    if (currentSong?.image_url) {
      setIsLightboxOpen(true);
    }
  }, [currentSong]);

  const handleCloseLightBox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  const mainArtist = useMemo(() => {
    if (!currentSong) return { id: "", display_name: "" };

    if (!currentSong.artists || currentSong.artists.length === 0) {
      return { id: "", display_name: "" };
    }

    return (
      getMainArtist(currentSong.artists) ?? {
        id: "",
        display_name: "",
      }
    );
  }, [currentSong]);

  useKeyboardShortcuts({
    onToggleLike: handleToggleLike,
    onToggleQueue: handleManageQueue,
    onShowShortcuts: () => setIsShortcutsModalOpen(true),
    isAuthenticated,
  });

  return (
    <>
      <div className={styles.nowPlayingBar}>
        <div className={styles.nowPlayingInfo}>
          <LazyImg
            src={currentSong?.image_url || musicPlaceholder}
            blurHash={currentSong?.image_url_blurhash}
            alt={`${currentSong?.title} album art`}
            imgClassNames={[styles.albumArt]}
            onClick={handleOpenLightBox}
          />
          <div className={styles.songInfo}>
            {mainArtist.id ? (
              <Link
                to={`/artists/${mainArtist.id}`}
                className={styles.artistName}
              >
                {mainArtist.display_name || ""}
              </Link>
            ) : (
              <span className={styles.artistName}>
                {mainArtist.display_name || ""}
              </span>
            )}
            <Link to={`/songs/${currentSong?.id}`} className={styles.songTitle}>
              {currentSong?.title || ""}
            </Link>
          </div>
        </div>

        <div className={styles.playerControls}>
          <div className={styles.controlButtons}>
            <button
              className={classNames(
                styles.controlButton,
                styles.shuffleButton,
                {
                  [styles.controlButtonActive]: isShuffled,
                }
              )}
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
            disabled={isLikeLoading}
            onClick={handleToggleLike}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <LuThumbsUp />
          </button>
          <div className={styles.queueButtonContainer}>
            <button
              ref={queueButtonRef}
              className={styles.controlButton}
              onClick={handleManageQueue}
              aria-label="Manage Queue"
            >
              <LuListEnd />
            </button>
            <QueueManager
              isOpen={isQueueManagerOpen}
              onClose={() => setIsQueueManagerOpen(false)}
              buttonRef={queueButtonRef}
            />
          </div>
          <button
            className={classNames(styles.controlButton, styles.playlistButton)}
            onClick={handleAddToPlaylist}
            aria-label="Add to Playlist"
          >
            <LuListPlus />
          </button>
          <div ref={volumeControlRef} className={styles.volumeControl}>
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
            onClick={handleShare}
            disabled={isLoading || !currentSong}
          >
            <LuShare />
          </button>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        pageUrl={`${window.location.origin}/songs/${currentSong?.id}`}
        pageTitle={currentSong?.title}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {currentSong && currentSong.image_url && (
        <CoverLightbox
          isOpen={isLightboxOpen}
          onClose={handleCloseLightBox}
          imageUrl={currentSong.image_url}
          altText={`${currentSong.title} Cover`}
        />
      )}
    </>
  );
};

export default memo(NowPlayingBar);
