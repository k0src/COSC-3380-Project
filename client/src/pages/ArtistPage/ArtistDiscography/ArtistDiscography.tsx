import { memo, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { artistApi } from "@api";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
import {
  ErrorPage,
  PageLoader,
  CoverLightbox,
  EntityItemCard,
  LazyImg,
} from "@components";
import {
  formatDateString,
  getMainArtist,
  formatNumber,
  pluralize,
} from "@util";
import styles from "./ArtistDiscography.module.css";
import artistPlaceholder from "@assets/artist-placeholder.webp";
import musicPlaceholder from "@assets/music-placeholder.webp";
import { LuArrowLeft } from "react-icons/lu";

const StatItem = memo(({ value, label }: { value: number; label: string }) => (
  <div className={styles.statItem}>
    {formatNumber(value)} {label}
  </div>
));

const ArtistDiscography: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  //! ADD LIMITS AND PAGINATION
  const { data, loading, error } = useAsyncData(
    {
      artist: () => artistApi.getArtistById(id || "", { includeUser: true }),
      albums: () => artistApi.getAlbums(id || ""),
      singles: () =>
        artistApi.getSongs(id || "", {
          includeArtists: true,
          onlySingles: true,
        }),
      numberOfSongs: () => artistApi.getNumberOfSongs(id || ""),
      numberOfAlbums: () => artistApi.getNumberOfAlbums(id || ""),
      numberOfSingles: () => artistApi.getNumberOfSingles(id || ""),
    },
    [id],
    {
      cacheKey: `artist_discography_${id}`,
      hasBlobUrl: true,
    }
  );

  const artist = data?.artist;
  const albums = data?.albums ?? [];
  const singles = data?.singles ?? [];
  const numberOfSongs = data?.numberOfSongs ?? 0;
  const numberOfAlbums = data?.numberOfAlbums ?? 0;
  const numberOfSingles = data?.numberOfSingles ?? 0;

  const artistImageUrl = useMemo(
    () => artist?.user?.profile_picture_url || artistPlaceholder,
    [artist]
  );

  const noDiscography = useMemo(
    () => numberOfAlbums === 0 && numberOfSingles === 0,
    [numberOfAlbums, numberOfSingles, numberOfSongs]
  );

  const handleLightboxClose = useCallback(() => setIsLightboxOpen(false), []);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  if (!id) {
    return (
      <ErrorPage
        title="Artist Not Found"
        message="The requested artist does not exist."
      />
    );
  }

  if (error) {
    return (
      <ErrorPage
        title="Internal Server Error"
        message="An unexpected error occurred. Please try again later."
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {artist
            ? `${artist.display_name} - Discography`
            : "Artist Discography"}
        </title>
      </Helmet>

      {loading ? (
        <PageLoader />
      ) : !artist ? (
        <ErrorPage
          title="Artist Not Found"
          message="The requested artist does not exist."
        />
      ) : (
        <>
          <div className={styles.artistDiscographyLayout}>
            <div className={styles.headerContainer}>
              <Link to={`/artists/${id}`} className={styles.backLink}>
                <LuArrowLeft /> Back to artist page
              </Link>
              <header className={styles.discoHeader}>
                <LazyImg
                  src={artistImageUrl || artistPlaceholder}
                  alt={`${artist.display_name} Image`}
                  imgClassNames={[
                    styles.artistImage,
                    artistImageUrl ? styles.artistImageClickable : "",
                  ]}
                  loading="eager"
                  onClick={handleImageClick}
                />
                <div className={styles.artistInfo}>
                  <h1 className={styles.discoTitle}>
                    {artist.display_name}'s Discography
                  </h1>

                  <div className={styles.artistStats}>
                    {numberOfSongs > 0 && (
                      <StatItem
                        value={numberOfSongs}
                        label={pluralize(numberOfSongs, "Song")}
                      />
                    )}
                    {numberOfAlbums > 0 && (
                      <>
                        <span className={styles.statsBullet}>&bull;</span>
                        <StatItem
                          value={numberOfAlbums}
                          label={pluralize(numberOfAlbums, "Album")}
                        />
                      </>
                    )}
                    {numberOfSingles > 0 && (
                      <>
                        <span className={styles.statsBullet}>&bull;</span>
                        <StatItem
                          value={numberOfSingles}
                          label={pluralize(numberOfSingles, "Single")}
                        />
                      </>
                    )}
                  </div>
                </div>
              </header>
            </div>

            <div className={styles.discoSection}>
              {albums && albums.length > 0 && (
                <div className={styles.sectionContainer}>
                  <span className={styles.sectionTitle}>Albums</span>
                  <div className={styles.itemsGrid}>
                    {albums.map((album) => (
                      <EntityItemCard
                        entity={album}
                        key={album.id}
                        type="album"
                        linkTo={`/albums/${album.id}`}
                        author={artist.display_name}
                        title={album.title}
                        subtitle={formatDateString(album.release_date)}
                        imageUrl={album.image_url || musicPlaceholder}
                        blurHash={album.image_url_blurhash}
                      />
                    ))}
                  </div>
                </div>
              )}
              {singles && singles.length > 0 && (
                <div className={styles.sectionContainer}>
                  <span className={styles.sectionTitle}>Singles</span>
                  <div className={styles.itemsGrid}>
                    {singles.map((single) => (
                      <EntityItemCard
                        entity={single}
                        key={single.id}
                        type="song"
                        linkTo={`/songs/${single.id}`}
                        author={
                          getMainArtist(single.artists || [])?.display_name ||
                          "Unknown Artist"
                        }
                        title={single.title}
                        subtitle={formatDateString(single.release_date)}
                        imageUrl={single.image_url || musicPlaceholder}
                        blurHash={single.image_url_blurhash}
                      />
                    ))}
                  </div>
                </div>
              )}

              {noDiscography && (
                <div className={styles.noDiscography}>
                  {artist.display_name} has not released any albums or singles
                  yet.
                </div>
              )}
            </div>
          </div>

          {artistImageUrl && (
            <CoverLightbox
              isOpen={isLightboxOpen}
              onClose={handleLightboxClose}
              imageUrl={artistImageUrl}
              altText={`${artist.display_name} Image`}
            />
          )}
        </>
      )}
    </>
  );
};

export default memo(ArtistDiscography);
