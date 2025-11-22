import { memo, useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@contexts";
import { artistApi } from "@api";
import type { UUID, AccessContext } from "@types";
import { useAsyncData, useErrorCheck } from "@hooks";
import {
  ErrorPage,
  PageLoader,
  ArtistBanner,
  RelatedArtists,
  ArtistActions,
  ArtistFeaturedOnPlaylists,
  ArtistAbout,
  SlidingCardList,
  SongsList,
  FollowProfiles,
  EditArtistModal,
  TopResultCard,
  ArtistPlaylists,
} from "@components";
import styles from "./ArtistPage.module.css";
import { formatDateString } from "@util";

const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();
  const { user, isAuthenticated } = useAuth();

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "single",
  };

  const globalCtx: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "globalList",
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!id) {
    return (
      <ErrorPage
        title="Artist Not Found"
        message="The requested artist does not exist."
      />
    );
  }

  const { data, loading, error, refetch } = useAsyncData(
    {
      artist: () =>
        artistApi.getArtistById(id, accessContext, { includeUser: true }),
      pinned: () => artistApi.getPinnedAlbum(id, accessContext),
      hasSongsData: () => artistApi.checkArtistHasSongs(id),
    },
    [id],
    {
      cacheKey: `artist_${id}`,
      hasBlobUrl: true,
    }
  );

  const artist = data?.artist;
  const pinnedAlbum = data?.pinned;
  const hasSongs = data?.hasSongsData?.hasSongs ?? false;

  const isOwner = useMemo(() => {
    if (!user || !isAuthenticated || !artist) {
      return false;
    }
    return user.id === artist.user_id;
  }, [user, isAuthenticated, artist]);

  const fetchPopularSongs = useCallback(
    () =>
      artistApi.getSongs(id, globalCtx, {
        includeAlbums: true,
        includeArtists: true,
        orderByColumn: "streams",
        orderByDirection: "DESC",
        limit: 10,
      }),
    [id]
  );

  const fetchAlbums = useCallback(
    () => artistApi.getAlbums(id, globalCtx, { limit: 10 }),
    [id]
  );

  const fetchSingles = useCallback(
    () =>
      artistApi.getSongs(id, globalCtx, {
        includeArtists: true,
        onlySingles: true,
        limit: 10,
      }),
    [id]
  );

  const handleEditArtist = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleArtistEdited = useCallback(() => {
    refetch();
  }, [refetch]);

  const { shouldShowError, errorTitle, errorMessage } = useErrorCheck([
    {
      condition: !!error,
      title: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
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
    {
      condition: artist?.user?.status === "DEACTIVATED" && !isOwner,
      title: "Artist Not Found",
      message: "The requested artist does not exist.",
    },
  ]);

  if (loading) {
    return <PageLoader />;
  }

  if (shouldShowError) {
    return <ErrorPage title={errorTitle} message={errorMessage} />;
  }

  return (
    <>
      <Helmet>
        <title>{`${artist.display_name} - CoogMusic`}</title>
      </Helmet>

      <div className={styles.artistLayout}>
        <ArtistBanner
          artist={artist}
          isOwner={isOwner}
          onEditButtonClick={handleEditArtist}
        />
        <div className={styles.artistLayoutBottom}>
          <div className={styles.artistLayoutBottomTop}>
            {hasSongs ? (
              <div className={styles.artistLayoutBottomLeft}>
                {pinnedAlbum && (
                  <div className={styles.sectionContainer}>
                    <span className={styles.sectionTitle}>Artist's Pick</span>
                    <TopResultCard
                      type="album"
                      entity={pinnedAlbum}
                      linkTo={`/albums/${pinnedAlbum.id}`}
                      title={pinnedAlbum.title}
                      subtitle={formatDateString(pinnedAlbum.release_date)}
                      imageUrl={pinnedAlbum.image_url}
                      blurHash={pinnedAlbum.image_url_blurhash}
                      author={artist.display_name}
                    />
                  </div>
                )}
                <SongsList
                  title="Popular"
                  fetchData={fetchPopularSongs}
                  cacheKey={`popular_songs_${id}`}
                  dependencies={[id]}
                  viewMoreLink={`/artists/${id}/discography`}
                />
                <SlidingCardList
                  title="Albums"
                  artistName={artist.display_name}
                  artistId={artist.id}
                  fetchData={fetchAlbums}
                  type="album"
                  itemsPerView={6}
                  cacheKey={`artist_${id}_albums`}
                  dependencies={[id]}
                />
                <SlidingCardList
                  title="Singles"
                  fetchData={fetchSingles}
                  type="song"
                  itemsPerView={6}
                  cacheKey={`artist_${id}_singles`}
                  dependencies={[id]}
                />
              </div>
            ) : (
              <div className={styles.noDataContainer}>
                <span className={styles.noDataText}>
                  This artist has not uploaded any songs yet.
                </span>
              </div>
            )}
            <div className={styles.artistLayoutBottomRight}>
              {artist.user?.id && (
                <>
                  <ArtistActions
                    artistId={artist.id}
                    userId={artist.user.id}
                    artistName={artist.display_name}
                    shareLink={window.location.href}
                  />
                  <FollowProfiles
                    title="Followers"
                    userId={artist.user.id}
                    profileLimit={8}
                    profileMin={4}
                    following={false}
                  />
                  <FollowProfiles
                    title="Following"
                    userId={artist.user.id}
                    profileMin={4}
                    profileLimit={8}
                  />
                </>
              )}
              <ArtistPlaylists artistId={artist.id} />
              <ArtistFeaturedOnPlaylists
                artistId={artist.id}
                artistName={artist.display_name}
              />
            </div>
          </div>
        </div>
        <RelatedArtists artistId={artist.id} />
        <ArtistAbout
          artistId={artist.id}
          artistName={artist.display_name}
          artistBio={artist.bio}
        />
      </div>

      {isOwner && (
        <EditArtistModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          artist={artist}
          onArtistEdited={handleArtistEdited}
        />
      )}
    </>
  );
};

export default memo(ArtistPage);
