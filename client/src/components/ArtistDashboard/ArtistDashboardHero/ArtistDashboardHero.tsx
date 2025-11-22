import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import type { UUID, Song } from "@types";
import { useAsyncData } from "@hooks";
import { statsApi } from "@api";
import { HorizontalRule, LazyImg } from "@components";
import styles from "./ArtistDashboardHero.module.css";
import { formatDateString } from "@util";
import { LuChartColumnIncreasing, LuSettings2 } from "react-icons/lu";

interface ArtistQuickStats {
  listeners: number;
  streams: number;
  newFollowers: number;
  playlistAdds: number;
}

interface HeroLeftProps {
  artistImageUrl: string;
  artistImageUrlBlurhash?: string;
  artistName: string;
  stats?: ArtistQuickStats;
  noStats: boolean;
}

const HeroLeft: React.FC<HeroLeftProps> = memo(
  ({ artistImageUrl, artistImageUrlBlurhash, artistName, stats, noStats }) => (
    <div className={styles.heroLeft}>
      <LazyImg
        src={artistImageUrl}
        alt="Artist Profile"
        imgClassNames={[styles.heroArtistImg]}
        blurHash={artistImageUrlBlurhash}
      />
      <div className={styles.artistInfo}>
        <span className={styles.artistInfoName}>{artistName}</span>
        {!noStats ? (
          <span className={styles.artistStory}>
            Over the last month, you've had{" "}
            <strong>{stats?.listeners || 0}</strong> listeners and{" "}
            <strong>{stats?.streams || 0}</strong> streams. You've gained{" "}
            <strong>{stats?.newFollowers || 0}</strong> new followers, and your
            songs have been added to <strong>{stats?.playlistAdds || 0}</strong>{" "}
            playlists. Keep creating and engaging with your audience to grow
            your presence on CoogMusic!
          </span>
        ) : (
          <span className={styles.artistStory}>
            You don't have any stats yet. Upload some songs and share your music
            to start gaining listeners and followers!
          </span>
        )}
      </div>
    </div>
  )
);

interface HeroRightProps {
  topSong?: Song;
  artistImageUrl: string;
  artistImageUrlBlurhash?: string;
}

const HeroRight: React.FC<HeroRightProps> = memo(
  ({ topSong, artistImageUrl, artistImageUrlBlurhash }) => (
    <div className={styles.heroRight}>
      {topSong ? (
        <div className={styles.topSongCard}>
          <LazyImg
            src={topSong.image_url || artistImageUrl}
            alt="Top Song Cover"
            imgClassNames={[styles.topSongImg]}
            blurHash={topSong.image_url_blurhash || artistImageUrlBlurhash}
          />
          <div className={styles.topSongInfo}>
            <div className={styles.topSongInfoTop}>
              <div className={styles.topSongInfoTopLeft}>
                <span className={styles.topSongHeaderText}>
                  <LuChartColumnIncreasing /> Top Performing Song This Month
                </span>
                <Link
                  to={`/songs/${topSong.id}`}
                  className={styles.topSongTitle}
                >
                  {topSong.title}
                </Link>
                <span className={styles.topSongSubtitle}>
                  {formatDateString(topSong.release_date)}
                </span>
              </div>
              <Link to="/artist-dashboard/manage" className={styles.manageIcon}>
                <LuSettings2 />
              </Link>
            </div>
            <HorizontalRule />
            <div className={styles.topSongStats}>
              <span className={styles.topSongStatItem}>
                <strong>{topSong.streams ?? 0}</strong> streams
              </span>
              <span className={styles.statsBull}>&bull;</span>
              <span className={styles.topSongStatItem}>
                <strong>{topSong.likes ?? 0}</strong> likes
              </span>
              <span className={styles.statsBull}>&bull;</span>
              <span className={styles.topSongStatItem}>
                <strong>{topSong.comments ?? 0}</strong> comments
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.noDataCard}>
          <div className={styles.noDataMessage}>
            No song data available yet. Upload your first song to see stats!
          </div>
        </div>
      )}
    </div>
  )
);

export interface ArtistDashboardHeroProps {
  artistId: UUID;
  artistName: string;
  artistImageUrl: string;
  artistImageUrlBlurhash?: string;
}

const ArtistDashboardHero: React.FC<ArtistDashboardHeroProps> = ({
  artistId,
  artistName,
  artistImageUrl,
  artistImageUrlBlurhash,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      artist: () => statsApi.getArtistQuickStats(artistId, 30),
      topSong: () => statsApi.getArtistTopSong(artistId, 30),
    },
    [artistId],
    {
      cacheKey: `artist_dashboard_hero_stats_${artistId}`,
      enabled: !!artistId,
    }
  );

  const stats = data?.artist;
  const topSong = data?.topSong;

  const noStats = useMemo(() => {
    return (
      (stats?.listeners || 0) === 0 &&
      (stats?.streams || 0) === 0 &&
      (stats?.newFollowers || 0) === 0 &&
      (stats?.playlistAdds || 0) === 0
    );
  }, [stats]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Failed to load stats.</div>;
  }

  return (
    <div className={styles.heroContainer}>
      <HeroLeft
        artistImageUrl={artistImageUrl}
        artistImageUrlBlurhash={artistImageUrlBlurhash}
        artistName={artistName}
        stats={stats}
        noStats={noStats}
      />
      <HeroRight
        topSong={topSong}
        artistImageUrl={artistImageUrl}
        artistImageUrlBlurhash={artistImageUrlBlurhash}
      />
    </div>
  );
};

export default memo(ArtistDashboardHero);
