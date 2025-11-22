import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { useAsyncData } from "@hooks";
import { statsApi } from "@api";
import { LazyImg, HorizontalRule } from "@components";
import { formatNumber, formatRelativeDate } from "@util";
import type { UUID } from "@types";
import styles from "./ArtistDashboardRecentRelease.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import { LuClock, LuSettings2 } from "react-icons/lu";

export interface ArtistDashboardRecentReleaseProps {
  artistId: UUID;
}

const ArtistDashboardRecentRelease: React.FC<
  ArtistDashboardRecentReleaseProps
> = ({ artistId }) => {
  const { data, loading, error } = useAsyncData(
    {
      recentRelease: () => statsApi.getArtistRecentRelease(artistId),
    },
    [artistId],
    {
      cacheKey: `artist_recent_release_${artistId}`,
      hasBlobUrl: true,
    }
  );

  const recentRelease = data?.recentRelease;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorText}>
          Error loading recent release. Please try again later.
        </span>
      </div>
    );
  }

  return (
    <div className={styles.recentReleaseCard}>
      <LazyImg
        src={recentRelease.image_url || musicPlaceholder}
        blurHash={recentRelease.image_url_blurhash}
        imgClassNames={[styles.recentReleaseImg]}
        alt="Recent Release Cover"
      />
      <div className={styles.recentReleaseInfo}>
        <div className={styles.recentReleaseInfoTop}>
          <div className={styles.recentReleaseInfoTopLeft}>
            <span className={styles.recentReleaseHeaderText}>
              <LuClock /> Recent Release
            </span>
            <Link
              to={`/songs/${recentRelease.id}`}
              className={styles.recentReleaseTitle}
            >
              {recentRelease.title}
            </Link>
            <span className={styles.recentReleaseSubtitle}>
              {formatRelativeDate(recentRelease.release_date)}
            </span>
          </div>
          <Link to="/artist-dashboard/manage" className={styles.manageIcon}>
            <LuSettings2 />
          </Link>
        </div>
        <HorizontalRule />
        <div className={styles.recentReleaseStats}>
          <span className={styles.recentReleaseStatItem}>
            <strong>{formatNumber(recentRelease.streams ?? 0)}</strong> streams
          </span>
          <span className={styles.statsBull}>&bull;</span>
          <span className={styles.recentReleaseStatItem}>
            <strong>{formatNumber(recentRelease.likes ?? 0)}</strong> likes
          </span>
          <span className={styles.statsBull}>&bull;</span>
          <span className={styles.recentReleaseStatItem}>
            <strong>{formatNumber(recentRelease.comments ?? 0)}</strong>{" "}
            comments
          </span>
        </div>
      </div>
    </div>
  );
};

export default memo(ArtistDashboardRecentRelease);
