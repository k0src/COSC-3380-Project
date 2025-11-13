import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import type { Song } from "@types";
import { useAsyncData } from "@hooks";
import { EntityItem } from "@components";
import { getMainArtist } from "@util";
import styles from "./SongsList.module.css";
import { Link } from "react-router-dom";

export interface SongsListProps {
  title?: string;
  fetchData: () => Promise<Song[]>;
  cacheKey: string;
  dependencies?: any[];
  viewMoreLink?: string;
}

const SongsList: React.FC<SongsListProps> = ({
  title,
  fetchData,
  cacheKey,
  dependencies = [],
  viewMoreLink,
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

  const songs = data?.songs;

  const songAuthor = useMemo(
    () => (song: Song) => getMainArtist(song.artists ?? [])?.display_name || "",
    []
  );

  const songAuthorLink = useMemo(
    () => (song: Song) => {
      const artist = getMainArtist(song.artists ?? []);
      return artist ? `/artists/${artist.id}` : undefined;
    },
    []
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={35} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        Failed to load {title?.toLowerCase() || "songs"}.
      </div>
    );
  }

  if (!songs || songs.length === 0) {
    return null;
  }

  return (
    <div className={styles.songsContainer}>
      {title &&
        (viewMoreLink ? (
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <Link to={viewMoreLink} className={styles.viewMoreLink}>
              View More
            </Link>
          </div>
        ) : (
          <h2 className={styles.sectionTitle}>{title}</h2>
        ))}

      <div className={styles.songsList}>
        {songs.map((song, i) => (
          <EntityItem
            key={song.id}
            type="song"
            linkTo={`/songs/${song.id}`}
            author={songAuthor(song)}
            authorLinkTo={songAuthorLink(song)}
            title={song.title}
            subtitle={song.albums?.[0]?.title || ""}
            imageUrl={song.image_url}
            blurHash={song.image_url_blurhash}
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
