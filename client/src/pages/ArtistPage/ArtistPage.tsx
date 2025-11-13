import { memo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { artistApi } from "@api";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
import {
  ErrorPage,
  PageLoader,
  ArtistBanner,
  RelatedArtists,
  ArtistActions,
  ArtistPlaylists,
  ArtistAbout,
  SlidingCardList,
  SongsList,
  FollowProfiles,
} from "@components";
import styles from "./ArtistPage.module.css";

const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  if (!id) {
    return (
      <ErrorPage
        title="Artist Not Found"
        message="The requested artist does not exist."
      />
    );
  }

  const { data, loading, error } = useAsyncData(
    {
      artist: () => artistApi.getArtistById(id, { includeUser: true }),
    },
    [id],
    {
      cacheKey: `artist_${id}`,
      hasBlobUrl: true,
    }
  );

  const artist = data?.artist;

  const fetchPopularSongs = useCallback(
    () =>
      artistApi.getSongs(id, {
        includeAlbums: true,
        includeArtists: true,
        orderByColumn: "streams",
        orderByDirection: "DESC",
        limit: 10,
      }),
    [id]
  );

  const fetchAlbums = useCallback(
    () => artistApi.getAlbums(id, { limit: 10 }),
    [id]
  );

  const fetchSingles = useCallback(
    () =>
      artistApi.getSongs(id, {
        includeArtists: true,
        onlySingles: true,
        limit: 10,
      }),
    [id]
  );

  if (error) {
    return (
      <ErrorPage
        title="Internal Server Error"
        message="An unexpected error occurred. Please try again later."
      />
    );
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!artist) {
    return (
      <ErrorPage
        title="Artist Not Found"
        message="The requested artist does not exist."
      />
    );
  }

  if (!artist.user || artist.user.status === "DEACTIVATED") {
    return (
      <ErrorPage
        title="Artist Not Found"
        message="The requested artist does not exist."
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${artist.display_name} - CoogMusic`}</title>
      </Helmet>

      <div className={styles.artistLayout}>
        <ArtistBanner
          bannerImageUrl={artist.banner_image_url}
          bannerImgBlurHash={artist.banner_image_url_blurhash}
          artistImageUrl={artist.user?.profile_picture_url}
          artistImgBlurHash={artist.user?.pfp_blurhash}
          artistName={artist.display_name}
          artistLocation={artist.location}
          isVerified={artist.verified}
        />
        <div className={styles.artistLayoutBottom}>
          <div className={styles.artistLayoutBottomTop}>
            <div className={styles.artistLayoutBottomLeft}>
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
              <ArtistPlaylists
                artistId={artist.id}
                artistName={artist.display_name}
              />
            </div>
          </div>
        </div>
        <RelatedArtists artistId={artist.id} />
        <ArtistAbout artistId={artist.id} artistName={artist.display_name} />
      </div>
    </>
  );
};

export default memo(ArtistPage);
