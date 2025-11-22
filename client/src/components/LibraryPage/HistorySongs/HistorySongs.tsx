import { memo, useMemo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID, AccessContext } from "@types";
import { EntityItemCard } from "@components";
import { libraryApi } from "@api";
import { formatDateString, getMainArtist } from "@util";
import { useAsyncData } from "@hooks";
import styles from "./HistorySongs.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

const HistorySongs: React.FC<{
  userId: UUID;
  searchFilter?: string;
  accessContext: AccessContext;
}> = ({ userId, searchFilter = "", accessContext }) => {
  const { data, loading, error } = useAsyncData(
    {
      songs: () =>
        libraryApi.getSongHistory(userId, accessContext, {
          timeRange: "1 month",
        }),
    },
    [userId, accessContext.userId],
    {
      cacheKey: `history_songs_${userId}`,
      hasBlobUrl: true,
    }
  );

  const songs = data?.songs ?? [];

  const filteredSongs = useMemo(() => {
    if (!searchFilter.trim()) {
      return songs;
    }

    const lowerFilter = searchFilter.toLowerCase();
    return songs.filter((song) =>
      song.title.toLowerCase().includes(lowerFilter)
    );
  }, [songs, searchFilter]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading songs.</div>;
  }

  return (
    <>
      {filteredSongs.length === 0 ? (
        <span className={styles.noSongs}>
          {searchFilter.trim()
            ? "No songs match your search."
            : "You haven't listened to any songs yet."}
        </span>
      ) : (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Song History</span>
          <div className={styles.itemsGrid}>
            {filteredSongs.map((song) => {
              const mainArtist = getMainArtist(song.artists || []);

              return (
                <EntityItemCard
                  key={song.id}
                  entity={song}
                  type="song"
                  linkTo={`/songs/${song.id}`}
                  author={mainArtist?.display_name || "Unknown Artist"}
                  authorLinkTo={
                    mainArtist?.id ? `/artists/${mainArtist.id}` : undefined
                  }
                  title={song.title}
                  subtitle={formatDateString(song.release_date)}
                  imageUrl={song.image_url || musicPlaceholder}
                  blurHash={song.image_url_blurhash}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(HistorySongs);
