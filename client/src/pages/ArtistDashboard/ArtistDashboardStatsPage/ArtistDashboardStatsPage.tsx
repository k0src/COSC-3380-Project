import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@contexts";
import type { Artist } from "@types";
import styles from "./ArtistDashboardStatsPage.module.css";
import {
  ArtistDashboardTopSongs,
  ArtistDashboardTopPlaylists,
  ArtistDashboardTopListeners,
  ArtistDashboardAllTimeStats,
  ArtistDashboardRecentRelease,
  ArtistDashboardBarChart,
  ArtistDashboardTopSongsBarChart,
  ArtistDashboardPieChart,
  ArtistDashboardFollowerChart,
} from "@components";

interface ArtistDashboardStatsPageProps {
  artist?: Artist;
}

const ArtistDashboardStatsPage: React.FC<ArtistDashboardStatsPageProps> = ({
  artist,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const artistId = user?.artist_id;

  const artistName = useMemo(() => {
    if (!artist) return "";
    return artist.display_name;
  }, [artist]);

  if (!artistId || !user) {
    navigate("/login");
    return;
  }

  return (
    <>
      <Helmet>
        <title>{`${artistName}'s Stats - CoogMusic`}</title>
      </Helmet>

      <div className={styles.statsLayout}>
        <span className={styles.statsTitle}>{artistName}'s Stats</span>
        <div className={styles.statsTop}>
          <ArtistDashboardAllTimeStats artistId={artistId!} userId={user.id} />
          <ArtistDashboardRecentRelease artistId={artistId!} userId={user.id} />
        </div>
        <ArtistDashboardBarChart artistId={artistId!} />
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>
            Your Top Songs & Playlists
          </span>
          <div className={styles.topItemsContainer}>
            <ArtistDashboardTopSongs artistId={artistId!} userId={user.id} />
            <ArtistDashboardTopPlaylists
              artistId={artistId!}
              userId={user.id}
            />
            <ArtistDashboardTopSongsBarChart
              artistId={artistId!}
              userId={user.id}
            />
          </div>
        </div>
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Your Top Listeners</span>
          <div className={styles.listenersContainer}>
            <ArtistDashboardTopListeners
              artistId={artistId!}
              userId={user.id}
            />
            <ArtistDashboardPieChart artistId={artistId!} />
          </div>
        </div>
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Follower Growth</span>
          <ArtistDashboardFollowerChart artistId={artistId!} />
        </div>
      </div>
    </>
  );
};

export default memo(ArtistDashboardStatsPage);
