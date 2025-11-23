import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { getMainArtist } from "@util";
import { EntityItemCard } from "@components";
import type { AccessContext, Song } from "@types";
import { songApi } from "@api";
import styles from "./RecentSongsList.module.css";

export interface RecentSongsListProps {
  accessContext: AccessContext;
}

const RecentSongsList: React.FC<RecentSongsListProps> = ({ accessContext }) => {
  const { data, loading, error } = useAsyncData(
    {
      recentSongs: () =>
        songApi.getMany(accessContext, {
          orderByColumn: "release_date",
          includeAlbums: true,
          includeArtists: true,
          orderByDirection: "DESC",
          limit: 8,
        }),
    },
    [],
    {
      cacheKey: `home_recent_songs`,
      hasBlobUrl: true,
    }
  );

  const recentSongs = data?.recentSongs;

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
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Failed to load recent songs.</div>;
  }

  if (!recentSongs || recentSongs.length === 0) {
    return <div className={styles.error}>No recent songs available.</div>;
  }

  return (
    <div className={styles.recentSongsContainer}>
      <span className={styles.sectionTitle}>Recently Uploaded Tracks</span>

      <div className={styles.recentSongsList}>
        {recentSongs.map((song: Song) => (
          <EntityItemCard
            key={song.id}
            type="song"
            linkTo={`/songs/${song.id}`}
            author={songAuthor(song)}
            authorLinkTo={songAuthorLink(song)}
            subtitle={song.albums?.[0]?.title || ""}
            title={song.title}
            imageUrl={song.image_url}
            blurHash={song.image_url_blurhash}
            entity={song}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(RecentSongsList);
