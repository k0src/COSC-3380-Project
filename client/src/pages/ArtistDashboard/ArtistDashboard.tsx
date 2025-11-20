import { memo, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@contexts";
import { useAsyncData, useErrorCheck } from "@hooks";
import { artistApi, commentApi, statsApi } from "@api";
import {
  PageLoader,
  ErrorPageBig,
  ArtistDashboardHero,
  ArtistDashboardStreamsChart,
  ArtistDashboardRecentReleases,
  CommentTable,
  ArtistDashboardChecklist,
  ArtistDashboardTopSongs,
  ArtistDashboardTopPlaylists,
} from "@components";
import styles from "./ArtistDashboard.module.css";
import {
  LuPlus,
  LuCircleUserRound,
  LuImage,
  LuUserRoundPen,
  LuListMusic,
} from "react-icons/lu";
import artistPlaceholder from "@assets/artist-placeholder.webp";

const ArtistDashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const artistId = user?.artist_id;

  const { data, loading, error } = useAsyncData(
    {
      artist: () => artistApi.getArtistById(artistId!, { includeUser: true }),
      hasSongs: () => statsApi.checkArtistHasSongs(artistId!),
    },
    [artistId!],
    {
      cacheKey: `artist_layout_${artistId}`,
      enabled: !!artistId,
    }
  );

  const artist = data?.artist;
  const hasSongs = data?.hasSongs?.hasSongs || false;

  const fetchArtistComments = useCallback(
    (sortColumn: string, sortDirection: string) => {
      return commentApi.getCommentsByArtistId(
        artistId!,
        6,
        sortColumn,
        sortDirection as "ASC" | "DESC"
      );
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

  const { shouldShowError, errorTitle, errorMessage } = useErrorCheck([
    {
      condition: !!error,
      title: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
    },
    {
      condition: !isAuthenticated || !user || !artistId,
      title: "Access Denied",
      message: "You do not have permission to access this page.",
    },
    {
      condition: !artist && !loading,
      title: "Artist Not Found",
      message: "The requested artist does not exist.",
    },
    {
      condition: artist?.user?.status !== "ACTIVE",
      title: "Artist Not Found",
      message: "The requested artist does not exist.",
    },
  ]);

  if (loading) {
    return <PageLoader />;
  }

  if (shouldShowError) {
    return <ErrorPageBig title={errorTitle} message={errorMessage} />;
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
            <ArtistDashboardRecentReleases artistId={artistId!} maxItems={5} />
            <CommentTable
              fetchData={fetchArtistComments}
              cacheKey={`artist_${artistId}_comments`}
              dependencies={[artistId]}
            />
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
