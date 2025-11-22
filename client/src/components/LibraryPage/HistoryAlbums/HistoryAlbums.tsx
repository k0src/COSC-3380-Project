import { memo, useMemo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID, AccessContext } from "@types";
import { EntityItemCard } from "@components";
import { libraryApi } from "@api";
import { formatDateString } from "@util";
import { useAsyncData } from "@hooks";
import styles from "./HistoryAlbums.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

const HistoryAlbums: React.FC<{
  userId: UUID;
  searchFilter?: string;
  accessContext: AccessContext;
}> = ({ userId, searchFilter = "", accessContext }) => {
  const { data, loading, error } = useAsyncData(
    {
      albums: () =>
        libraryApi.getAlbumHistory(userId, accessContext, {
          timeRange: "1 month",
        }),
    },
    [userId, accessContext.userId],
    {
      cacheKey: `history_albums_${userId}`,
      hasBlobUrl: true,
    }
  );

  const albums = data?.albums ?? [];

  const filteredAlbums = useMemo(() => {
    if (!searchFilter.trim()) {
      return albums;
    }

    const lowerFilter = searchFilter.toLowerCase();
    return albums.filter((album) =>
      album.title.toLowerCase().includes(lowerFilter)
    );
  }, [albums, searchFilter]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading albums.</div>;
  }

  return (
    <>
      {filteredAlbums.length === 0 ? (
        <span className={styles.noAlbums}>
          {searchFilter.trim()
            ? "No albums match your search."
            : "You haven't listened to any albums yet."}
        </span>
      ) : (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Album History</span>
          <div className={styles.itemsGrid}>
            {filteredAlbums.map((album) => (
              <EntityItemCard
                key={album.id}
                entity={album}
                type="album"
                linkTo={`/albums/${album.id}`}
                author={album.artist?.display_name || "Unknown"}
                authorLinkTo={
                  album.artist?.id ? `/artists/${album.artist.id}` : undefined
                }
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

export default memo(HistoryAlbums);
