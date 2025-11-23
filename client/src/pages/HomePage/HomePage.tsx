import { memo, useMemo } from "react";
import { useAsyncData, useErrorCheck } from "@hooks";
import { useAuth } from "@contexts";
import {
  PageLoader,
  ErrorPage,
  FeaturedPlaylist,
  RecentlyPlayedList,
  PopularList,
  NewFromArtistsList,
  ArtistCtaBanner,
  MyUploadsList,
  UserLikesList,
  RecentSongsList,
  TopArtistBanner,
  TrendingList,
  ArtistRecommendations,
} from "@components";
import { adminApi, libraryApi } from "@api";
import type { AccessContext } from "@types";
import styles from "./HomePage.module.css";

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const userIsArtist = useMemo(() => {
    return isAuthenticated && user && user.role !== "USER";
  }, [isAuthenticated, user]);

  const userId = useMemo(() => {
    return user ? user.id : null;
  }, [user]);

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "globalList",
  };

  const { data, loading, error } = useAsyncData(
    {
      featuredPlaylist: () => adminApi.getFeaturedPlaylist(accessContext),
      userHasHistory: () => libraryApi.checkUserHasSongHistory(user!.id),
    },
    [],
    {
      cacheKey: "home_featured_playlist",
      hasBlobUrl: true,
      enabled: !!userId,
    }
  );

  const featuredPlaylist = data?.featuredPlaylist;
  const userHasHistory = data?.userHasHistory;

  const { shouldShowError, errorTitle, errorMessage } = useErrorCheck([
    {
      condition: !!error,
      title: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
    },
  ]);

  if (loading) {
    return <PageLoader />;
  }

  if (shouldShowError) {
    return <ErrorPage title={errorTitle} message={errorMessage} />;
  }

  return (
    <div className={styles.homeLayout}>
      <div className={styles.homeTopSection}>
        {featuredPlaylist && (
          <FeaturedPlaylist featuredPlaylist={featuredPlaylist} />
        )}
        {userId && userHasHistory ? (
          <RecentlyPlayedList userId={userId} accessContext={accessContext} />
        ) : (
          <PopularList accessContext={accessContext} />
        )}
      </div>

      {userId && (
        <NewFromArtistsList userId={userId} accessContext={accessContext} />
      )}

      <div className={styles.homeRow}>
        <TrendingList accessContext={accessContext} />
        <TopArtistBanner days={30} />
      </div>

      {!userIsArtist && (
        <div className={styles.homeRow}>
          <ArtistCtaBanner />
          <UserLikesList userId={user!.id} accessContext={accessContext} />
        </div>
      )}
      {userIsArtist && (
        <MyUploadsList
          artistId={user!.artist_id!}
          accessContext={accessContext}
        />
      )}

      <RecentSongsList accessContext={accessContext} />
      <ArtistRecommendations userId={userId!} />
    </div>
  );
};

export default memo(HomePage);
