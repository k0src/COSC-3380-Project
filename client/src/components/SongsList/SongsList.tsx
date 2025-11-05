import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import type { Song } from "@types";
import { useAsyncData } from "@hooks";
import { EntityItem } from "@components";
import { getMainArtist } from "@util";
import styles from "./SongsList.module.css";

export interface SongsListProps {
  title: string;
  fetchData: () => Promise<Song[]>;
  cacheKey: string;
  dependencies?: any[];
}

const SongsList: React.FC<SongsListProps> = ({
  title,
  fetchData,
  cacheKey,
  dependencies = [],
}) => {
  const asyncConfig = useMemo(
    () => ({
      songs: fetchData,
    }),
    [fetchData]
  );

  const { data, loading, error } = useAsyncData(asyncConfig, dependencies, {
    cacheKey,
    hasBlobUrl: true,
  });

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={35} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>Failed to load {title.toLowerCase()}.</div>
    );
  }

  const songs = data?.songs;

  if (!songs || songs.length === 0) {
    return null;
  }

  return (
    <div className={styles.songsContainer}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.songsList}>
        {songs.map((song, i) => (
          <EntityItem
            key={song.id}
            type="song"
            linkTo={`/songs/${song.id}`}
            author={getMainArtist(song.artists ?? [])?.display_name || ""}
            title={song.title}
            subtitle={song.albums?.[0]?.title || ""}
            imageUrl={song.image_url}
            entity={song}
            isSmall={false}
            index={i + 1}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(SongsList);
