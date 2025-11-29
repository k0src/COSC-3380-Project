import { memo } from "react";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { statsApi } from "@api";
import { formatNumber, pluralize } from "@util";
import { LazyImg } from "@components";
import styles from "./AdminDashboardTopArtists.module.css";
import { LuBadgeCheck } from "react-icons/lu";
import artistPlaceholder from "@assets/artist-placeholder.webp";

const AdminDashboardTopArtists: React.FC = () => {
  const { data, loading, error } = useAsyncData(
    {
      topArtists: () => statsApi.getTopArtists(10),
    },
    [],
    {
      cacheKey: "admin_top_artists",
    }
  );

  const topArtists = data?.topArtists || [];

  if (loading) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Top Artists by Streams</span>
        </div>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Top Artists by Streams</span>
        </div>
        <div className={styles.error}>Failed to load top artists.</div>
      </div>
    );
  }

  if (topArtists.length === 0) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Top Artists by Streams</span>
        </div>
        <div className={styles.noDataContainer}>
          <span className={styles.noDataMessage}>No artists found.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Top Artists by Streams</span>
      </div>
      <div className={styles.artistsList}>
        {topArtists.map((artist, index) => (
          <Link
            key={artist.id}
            to={`/artists/${artist.id}`}
            className={styles.artistCard}
          >
            <div className={styles.artistRank}>
              <span className={styles.rankNumber}>#{index + 1}</span>
            </div>
            <LazyImg
              src={artist.user?.profile_picture_url || artistPlaceholder}
              blurHash={artist.user?.pfp_blurhash}
              alt={artist.display_name || "Artist"}
              imgClassNames={[styles.artistImage]}
            />
            <div className={styles.artistInfo}>
              <div className={styles.artistName}>
                <span className={styles.artistNameText}>
                  {artist.display_name || "Unknown Artist"}
                </span>
                {artist.verified && (
                  <LuBadgeCheck className={styles.verifiedIcon} />
                )}
              </div>
              <span className={styles.artistStreams}>
                {formatNumber(artist.streams ?? 0)}{" "}
                {pluralize(Number(artist.streams ?? 0), "stream")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default memo(AdminDashboardTopArtists);
