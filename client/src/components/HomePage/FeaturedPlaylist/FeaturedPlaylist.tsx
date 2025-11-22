import { memo, useCallback, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { useAsyncData, useStreamTracking } from "@hooks";
import { useAudioQueue } from "@contexts";
import { HorizontalRule, LazyImg } from "@components";
import { adminApi } from "@api";
import { formatNumber, pluralize, formatRuntime } from "@util";
import type { FeaturedPlaylist } from "@types";
import styles from "./FeaturedPlaylist.module.css";
import {
  LuClock,
  LuListMusic,
  LuPause,
  LuPlay,
  LuStar,
  LuThumbsUp,
} from "react-icons/lu";
import musicPlaceholder from "@assets/music-placeholder.webp";

export interface FeaturedPlaylistProps {
  featuredPlaylist: FeaturedPlaylist;
}

const FeaturedPlaylist: React.FC<FeaturedPlaylistProps> = ({
  featuredPlaylist,
}) => {
  const { state, actions } = useAudioQueue();
  const { trackPlaylistHistory } = useStreamTracking();
  const { queue, currentIndex, isPlaying } = state;

  const { data, loading, error } = useAsyncData(
    {
      coverGradient: () =>
        adminApi.getCoverGradient(featuredPlaylist.id, "playlist"),
    },
    [featuredPlaylist.id],
    {
      cacheKey: `featured_playlist_gradient_${featuredPlaylist.id}`,
      hasBlobUrl: true,
      enabled: !!featuredPlaylist?.id,
    }
  );

  const coverGradient = data?.coverGradient ?? {
    color1: { r: 8, g: 8, b: 8 },
    color2: { r: 213, g: 49, b: 49 },
  };

  const gradientStyle = useMemo(
    () =>
      ({
        "--cover-gradient-color1": `rgba(${coverGradient.color1.r}, ${coverGradient.color1.g}, ${coverGradient.color1.b}, 0.2)`,
        "--cover-gradient-color2": `rgba(${coverGradient.color2.r}, ${coverGradient.color2.g}, ${coverGradient.color2.b}, 0.2)`,
      } as React.CSSProperties),
    [coverGradient]
  );

  const currentQueueItem = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= queue.length) {
      return null;
    }
    return queue[currentIndex];
  }, [currentIndex, queue]);

  const isPlaylistPlaying = useMemo(() => {
    if (!featuredPlaylist.id || !currentQueueItem) return false;
    return (
      !currentQueueItem.isQueued &&
      currentQueueItem.sourceId === featuredPlaylist.id &&
      currentQueueItem.sourceType === "playlist"
    );
  }, [featuredPlaylist.id, currentQueueItem]);

  const handlePlayPause = useCallback(async () => {
    if (!featuredPlaylist) return;

    if (isPlaylistPlaying) {
      if (isPlaying) {
        actions.pause();
      } else {
        actions.resume();
      }
    } else {
      await trackPlaylistHistory(featuredPlaylist.id);
      actions.play(featuredPlaylist);
    }
  }, [
    featuredPlaylist,
    isPlaylistPlaying,
    isPlaying,
    actions,
    trackPlaylistHistory,
  ]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>Failed to load featured playlist.</div>
    );
  }

  return (
    <div className={styles.featuredPlaylist} style={gradientStyle}>
      <div className={styles.featuredPlaylistLeft}>
        <div className={styles.featuredPlaylistTitle}>
          <LuStar className={styles.featuredPlaylistTitleIcon} />
          <span className={styles.featuredPlaylistTitleText}>
            Featured Playlist
          </span>
        </div>

        <div className={styles.featuredPlaylistInfo}>
          <span className={styles.featuredPlaylistName}>
            {featuredPlaylist.title}
          </span>
          <Link
            className={styles.featuredPlaylistUsername}
            to={`/users/${featuredPlaylist.user?.id ?? ""}`}
          >
            {featuredPlaylist.user?.username ?? "CoogMusic User"}
          </Link>
          <div className={styles.featuredPlaylistInfoBottom}>
            <div className={styles.featuredPlaylistStats}>
              <div className={styles.featuredPlaylistStatItem}>
                <LuThumbsUp className={styles.featuredPlaylistStatIcon} />
                <span className={styles.featuredPlaylistStatLabel}>
                  {formatNumber(featuredPlaylist.likes ?? 0)}{" "}
                  {pluralize(Number(featuredPlaylist.likes ?? 0), "Like")}
                </span>
              </div>
              <div className={styles.statsBull}>&bull;</div>
              <div className={styles.featuredPlaylistStatItem}>
                <LuListMusic className={styles.featuredPlaylistStatIcon} />
                <span className={styles.featuredPlaylistStatLabel}>
                  {formatNumber(featuredPlaylist.song_count ?? 0)}{" "}
                  {pluralize(Number(featuredPlaylist.song_count ?? 0), "Song")}
                </span>
              </div>
              <div className={styles.statsBull}>&bull;</div>
              <div className={styles.featuredPlaylistStatItem}>
                <LuClock className={styles.featuredPlaylistStatIcon} />
                <span className={styles.featuredPlaylistStatLabel}>
                  {formatRuntime(featuredPlaylist.runtime ?? 0)}
                </span>
              </div>
            </div>
            <HorizontalRule />
            <button
              className={styles.featuredPlaylistPlayButton}
              onClick={handlePlayPause}
            >
              {isPlaylistPlaying && isPlaying ? (
                <>
                  <LuPause className={styles.featuredPlaylistPlayIcon} />
                  <span className={styles.featuredPlaylistPlayLabel}>
                    Pause
                  </span>
                </>
              ) : (
                <>
                  <LuPlay className={styles.featuredPlaylistPlayIcon} />
                  <span className={styles.featuredPlaylistPlayLabel}>Play</span>
                </>
              )}
            </button>
          </div>
        </div>

        <span className={styles.featuredPlaylistDescription}>
          {featuredPlaylist.description ?? "CoogMusic Featured Playlist"}
        </span>
      </div>

      <div className={styles.playlistImageWrapper}>
        <LazyImg
          src={featuredPlaylist.image_url || musicPlaceholder}
          blurHash={featuredPlaylist.image_url_blurhash}
          imgClassNames={[styles.featuredPlaylistImage]}
          alt={`${featuredPlaylist.title} Cover`}
        />
        <div className={styles.featuredBadge}>
          <LuStar />
        </div>
      </div>
    </div>
  );
};

export default memo(FeaturedPlaylist);
