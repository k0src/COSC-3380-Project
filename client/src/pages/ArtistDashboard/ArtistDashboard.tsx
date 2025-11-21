import { memo, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@contexts";
import { useAsyncData } from "@hooks";
import type { Artist } from "@types";
import { commentApi, statsApi } from "@api";
import {
  PageLoader,
  ArtistDashboardHero,
  ArtistDashboardStreamsChart,
  ArtistDashboardRecentReleases,
  ArtistDashboardChecklist,
  ArtistDashboardTopSongs,
  ArtistDashboardTopPlaylists,
  DataTable,
} from "@components";
import { commentColumns } from "@components/DataTable/columnDefinitions/commentColumns";
import styles from "./ArtistDashboard.module.css";
import {
  LuPlus,
  LuCircleUserRound,
  LuImage,
  LuUserRoundPen,
  LuListMusic,
} from "react-icons/lu";
import artistPlaceholder from "@assets/artist-placeholder.webp";

interface ArtistDashboardProps {
  artist?: Artist;
}

const ArtistDashboard: React.FC<ArtistDashboardProps> = ({ artist }) => {
  const { user } = useAuth();

  const artistId = user?.artist_id;

  const { data, loading } = useAsyncData(
    {
      hasSongs: () => statsApi.checkArtistHasSongs(artistId!),
    },
    [artistId!],
    {
      cacheKey: `artist_dashboard_data_${artistId}`,
      enabled: !!artistId,
    }
  );

  const hasSongs = data?.hasSongs?.hasSongs || false;

  const fetchArtistComments = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return commentApi.getCommentsByArtistId(artistId!, { limit, offset });
    },
    [artistId]
  );

  const artistName = useMemo(() => {
    if (!artist) return "";
    return artist.display_name;
  }, [artist]);

  const artistImageUrl = useMemo(() => {
    if (!artist) return artistPlaceholder;
    return artist.user?.profile_picture_url || artistPlaceholder;
  }, [artist]);

  const artistChecklistItems = useMemo(() => {
    return [
      {
        id: "pfp",
        label: "Add a Profile Picture",
        icon: LuCircleUserRound,
        completed: !!artist?.user?.profile_picture_url,
        link: `/artists/${artistId}`,
      },
      {
        id: "banner",
        label: "Add a Banner Image",
        icon: LuImage,
        completed: !!artist?.banner_image_url,
        link: `/artists/${artistId}`,
      },
      {
        id: "bio",
        label: "Complete Your Bio",
        icon: LuUserRoundPen,
        completed: !!artist?.bio,
        link: `/artists/${artistId}`,
      },
      {
        id: "song",
        label: "Upload Your First Song",
        icon: LuPlus,
        completed: hasSongs,
        link: "/artist-dashboard/add",
      },
      {
        id: "artist_playlist",
        label: "Create an Artist Playlist",
        icon: LuListMusic,
        completed: false,
        link: "/artist-dashboard/add",
      },
    ];
  }, [artist, artistId, hasSongs]);

  if (loading || !artist) {
    return <PageLoader />;
  }

  return (
    <>
      <Helmet>
        <title>{`${artistName}'s Dashboard - CoogMusic`}</title>
      </Helmet>

      <div className={styles.adLayout}>
        <header className={styles.adHeader}>
          <span className={styles.adTitle}>Welcome back, {artistName}</span>
          <Link className={styles.adHeaderButton} to="/artist-dashboard/add">
            <LuPlus /> Add New Content
          </Link>
        </header>
        <ArtistDashboardHero
          artistId={artistId!}
          artistName={artistName}
          artistImageUrl={artistImageUrl}
          artistImageUrlBlurhash={artist.user?.pfp_blurhash}
        />
        <div className={styles.contentAreaBottom}>
          <div className={styles.contentAreaBottomLeft}>
            <ArtistDashboardStreamsChart artistId={artistId!} />
            <ArtistDashboardRecentReleases artistId={artistId!} maxItems={6} />
            <div className={styles.sectionContainer}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Recent Comments</span>
                <Link
                  to="/artist-dashboard/comments"
                  className={styles.viewMoreLink}
                >
                  View More
                </Link>
              </div>
              <DataTable
                fetchData={fetchArtistComments}
                columns={commentColumns}
                cacheKey={`artist_${artistId}_comments`}
                dependencies={[artistId]}
                initialRowsPerPage={6}
                rowsPerPageOptions={[]}
              />
            </div>
          </div>
          <div className={styles.contentAreaBottomRight}>
            <ArtistDashboardChecklist items={artistChecklistItems} />
            <ArtistDashboardTopSongs artistId={artistId!} />
            <ArtistDashboardTopPlaylists artistId={artistId!} />
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(ArtistDashboard);
