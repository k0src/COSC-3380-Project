import { memo, useMemo, Children, isValidElement, cloneElement } from "react";
import { useAuth } from "@contexts";
import { useAsyncData, useErrorCheck } from "@hooks";
import { artistApi } from "@api";
import {
  ArtistLayoutSidebar,
  MainLayoutHeader,
  PageLoader,
  ErrorPageBig,
} from "@components";
import styles from "./ArtistDashboardLayout.module.css";
import artistPlaceholder from "@assets/artist-placeholder.webp";

export interface ArtistDashboardLayoutProps {
  children?: React.ReactNode;
}

const ArtistDashboardLayout: React.FC<ArtistDashboardLayoutProps> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuth();
  const artistId = user?.artist_id;

  const { data, loading, error } = useAsyncData(
    {
      artist: () => artistApi.getArtistById(artistId!, { includeUser: true }),
    },
    [artistId!],
    {
      cacheKey: `artist_layout_${artistId}`,
      enabled: !!artistId,
    }
  );

  const artist = data?.artist;

  const artistName = useMemo(() => {
    if (!artist) return "";
    return artist.display_name;
  }, [artist]);

  const artistImageUrl = useMemo(() => {
    if (!artist) return artistPlaceholder;
    return artist.user?.profile_picture_url || artistPlaceholder;
  }, [artist]);

  const injected = useMemo(
    () =>
      Children.map(children, (child) => {
        if (isValidElement(child)) {
          return cloneElement(child as React.ReactElement<any>, { artist });
        }
        return child;
      }),
    [children, artist]
  );

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
    <div className={styles.layoutContainer}>
      <ArtistLayoutSidebar
        artistName={artistName}
        artistImageUrl={artistImageUrl}
      />
      <div className={styles.mainContent}>
        <MainLayoutHeader />
        <main className={styles.contentArea}>{injected}</main>
      </div>
    </div>
  );
};

export default memo(ArtistDashboardLayout);
