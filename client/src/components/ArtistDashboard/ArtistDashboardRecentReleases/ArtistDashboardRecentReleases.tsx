import { memo, useMemo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import { Link } from "react-router-dom";
import { artistApi } from "@api";
import { useAsyncData } from "@hooks";
import type { UUID } from "@types";
import { ArtistEntityCard } from "@components";
import styles from "./ArtistDashboardRecentReleases.module.css";
import { formatRelativeDate } from "@util";

export interface ArtistDashboardRecentReleasesProps {
  artistId: UUID;
  maxItems: number;
}

const ArtistDashboardRecentReleases: React.FC<
  ArtistDashboardRecentReleasesProps
> = ({ artistId, maxItems }) => {
  const { data, loading, error } = useAsyncData(
    {
      recentSongs: () =>
        artistApi.getSongs(artistId, {
          orderByColumn: "release_date",
          orderByDirection: "DESC",
          limit: maxItems,
        }),
      recentAlbums: () =>
        artistApi.getAlbums(artistId, {
          orderByColumn: "release_date",
          orderByDirection: "DESC",
          limit: maxItems,
        }),
    },
    [artistId, maxItems],
    {
      cacheKey: `artist_dashboard_recent_releases_${artistId}_${maxItems}`,
      hasBlobUrl: true,
    }
  );

  const recentSongs = data?.recentSongs ?? [];
  const recentAlbums = data?.recentAlbums ?? [];

  const recentReleases = useMemo(() => {
    const combined = [
      ...recentSongs.map((song) => ({ ...song, type: "song" as const })),
      ...recentAlbums.map((album) => ({ ...album, type: "album" as const })),
    ];
    combined.sort((a, b) => {
      const dateA = new Date(a.release_date).getTime();
      const dateB = new Date(b.release_date).getTime();
      return dateB - dateA;
    });
    return combined;
  }, [recentSongs, recentAlbums]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading recent activity.</div>;
  }

  if (!recentSongs || recentSongs.length === 0) {
    return null;
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Recent Releases</span>
        <Link to="/artist-dashboard/manage" className={styles.viewMoreLink}>
          View More
        </Link>
      </div>
      <div className={styles.releaseList}>
        {recentReleases.map((release) => (
          <ArtistEntityCard
            key={release.id}
            type={release.type}
            title={release.title}
            linkTo={`/artist-dashboard/manage/${release.id}`}
            subtitle={formatRelativeDate(release.release_date)}
            imageUrl={release.image_url}
            blurhash={release.image_url_blurhash}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(ArtistDashboardRecentReleases);
