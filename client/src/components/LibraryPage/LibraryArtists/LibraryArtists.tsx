import { memo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID } from "@types";
import { LibraryArtist } from "@components";
import { libraryApi } from "@api";
import { useAsyncData } from "@hooks";
import styles from "./LibraryArtists.module.css";

const LibraryArtists: React.FC<{ userId: UUID }> = ({ userId }) => {
  const { data, loading, error } = useAsyncData(
    {
      artists: () => libraryApi.getLibraryArtists(userId),
    },
    [userId],
    {
      cacheKey: `library_artists_${userId}`,
      hasBlobUrl: true,
    }
  );

  const artists = data?.artists || [];

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading artists.</div>;
  }

  return (
    <>
      {artists.length === 0 ? (
        <span className={styles.noArtists}>No liked artists yet.</span>
      ) : (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Followed Artists</span>
          <div className={styles.itemsGrid}>
            {artists.map((artist) => (
              <LibraryArtist
                key={artist.id}
                artistId={artist.id}
                artistImageUrl={artist.user?.profile_picture_url}
                artistBlurHash={artist.user?.pfp_blurhash}
                artistName={artist.display_name}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(LibraryArtists);
