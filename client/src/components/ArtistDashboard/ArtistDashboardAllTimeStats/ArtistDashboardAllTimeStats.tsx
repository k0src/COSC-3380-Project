import { memo, useMemo } from "react";
import { useAsyncData } from "@hooks";
import { statsApi } from "@api";
import { formatNumber } from "@util";
import type { UUID, ArtistAllTimeStats } from "@types";
import styles from "./ArtistDashboardAllTimeStats.module.css";

export interface ArtistDashboardAllTimeStatsProps {
  artistId: UUID;
}

const ArtistDashboardAllTimeStats: React.FC<
  ArtistDashboardAllTimeStatsProps
> = ({ artistId }) => {
  const { data, loading, error } = useAsyncData(
    {
      stats: () => statsApi.getArtistAllTimeStats(artistId),
    },
    [artistId],
    {
      cacheKey: `artist_all_time_stats_${artistId}`,
    }
  );

  const stats = data?.stats;

  const bars = useMemo(() => {
    const barCount = 50;
    return Array.from({ length: barCount }, () =>
      Math.max(40, Math.random() * 100)
    );
  }, []);

  const hasData = useMemo(
    () =>
      stats !== undefined &&
      (stats.streams > 0 ||
        stats.likes > 0 ||
        stats.comments > 0 ||
        stats.unique_listeners > 0 ||
        stats.total_songs > 0),
    [stats]
  );

  return (
    <div className={styles.allTimeStats}>
      <div className={styles.allTimeTop}>
        <span className={styles.allTimeTitle}>All Time Stats</span>
        <span className={styles.allTimeSubtitle}>Updated Daily</span>
      </div>
      {loading ? (
        <div className={styles.loadingContainer}>
          <span className={styles.loadingText}>Loading...</span>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>
            Error loading stats. Please try again later.
          </span>
        </div>
      ) : !hasData ? (
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>No data available.</span>
        </div>
      ) : (
        <div className={styles.allTimeBottom}>
          <div className={styles.allTimeStatItem}>
            <span className={styles.allTimeNumber}>
              {formatNumber(stats?.streams ?? 0)}
            </span>
            <span className={styles.allTimeLabel}>Total Streams</span>
          </div>
          <div className={styles.verticalRule} />
          <div className={styles.allTimeStatItem}>
            <span className={styles.allTimeNumber}>
              {formatNumber(stats?.likes ?? 0)}
            </span>
            <span className={styles.allTimeLabel}>Total Likes</span>
          </div>
          <div className={styles.verticalRule} />
          <div className={styles.allTimeStatItem}>
            <span className={styles.allTimeNumber}>
              {formatNumber(stats?.comments ?? 0)}
            </span>
            <span className={styles.allTimeLabel}>Total Comments</span>
          </div>
          <div className={styles.verticalRule} />
          <div className={styles.allTimeStatItem}>
            <span className={styles.allTimeNumber}>
              {formatNumber(stats?.unique_listeners ?? 0)}
            </span>
            <span className={styles.allTimeLabel}>Unique Listeners</span>
          </div>
          <div className={styles.verticalRule} />
          <div className={styles.allTimeStatItem}>
            <span className={styles.allTimeNumber}>
              {formatNumber(stats?.total_songs ?? 0)}
            </span>
            <span className={styles.allTimeLabel}>Total Songs</span>
          </div>
        </div>
      )}
      <div className={styles.waveform}>
        {bars.map((height, index) => (
          <div
            key={index}
            className={styles.waveformBar}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(ArtistDashboardAllTimeStats);
