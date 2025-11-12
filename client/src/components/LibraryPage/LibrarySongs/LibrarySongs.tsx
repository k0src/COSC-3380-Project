import { memo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID } from "@types";
import { EntityItemCard } from "@components";
import { libraryApi } from "@api";
import { formatDateString, getMainArtist } from "@util";
import { useAsyncData } from "@hooks";
import styles from "./LibrarySongs.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

const LibrarySongs: React.FC<{ userId: UUID }> = ({ userId }) => {
  const { data, loading, error } = useAsyncData(
    {
      songs: () => libraryApi.getLibrarySongs(userId),
    },
    [userId],
    {
      cacheKey: `library_songs_${userId}`,
      hasBlobUrl: true,
    }
  );

  const songs = data?.songs || [];

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading songs.</div>;
  }

  return (
    <>
      {songs.length === 0 ? (
        <span className={styles.noSongs}>No liked songs yet.</span>
      ) : (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Liked Songs</span>
          <div className={styles.itemsGrid}>
            {songs.map((song) => (
              <EntityItemCard
                key={song.id}
                entity={song}
                type="song"
                linkTo={`/songs/${song.id}`}
                author={
                  getMainArtist(song.artists || [])?.display_name || "Unknown"
                }
                authorLinkTo={`/artists/${
                  getMainArtist(song.artists || [])?.id
                }`}
                title={song.title}
                subtitle={formatDateString(song.release_date)}
                imageUrl={song.image_url || musicPlaceholder}
                blurHash={song.image_url_blurhash}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(LibrarySongs);
