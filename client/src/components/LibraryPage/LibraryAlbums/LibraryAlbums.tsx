import { memo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID } from "@types";
import { EntityItemCard } from "@components";
import { libraryApi } from "@api";
import { formatDateString } from "@util";
import { useAsyncData } from "@hooks";
import styles from "./LibraryAlbums.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

const LibraryAlbums: React.FC<{ userId: UUID }> = ({ userId }) => {
  const { data, loading, error } = useAsyncData(
    {
      albums: () => libraryApi.getLibraryAlbums(userId),
    },
    [userId],
    {
      cacheKey: `library_albums_${userId}`,
      hasBlobUrl: true,
    }
  );

  const albums = data?.albums || [];

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading albums.</div>;
  }

  return (
    <>
      {albums.length === 0 ? (
        <span className={styles.noAlbums}>No liked albums yet.</span>
      ) : (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Liked Albums</span>
          <div className={styles.itemsGrid}>
            {albums.map((album) => (
              <EntityItemCard
                key={album.id}
                entity={album}
                type="album"
                linkTo={`/albums/${album.id}`}
                author={album.artist?.display_name || "Unknown"}
                authorLinkTo={`/artists/${album.artist?.id}`}
                title={album.title}
                subtitle={formatDateString(album.release_date)}
                imageUrl={album.image_url || musicPlaceholder}
                blurHash={album.image_url_blurhash}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(LibraryAlbums);
