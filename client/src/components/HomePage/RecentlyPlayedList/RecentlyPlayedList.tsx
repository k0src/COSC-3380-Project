import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { getMainArtist } from "@util";
import styles from "./RecentlyPlayedList.module.css";
import type { AccessContext, Song, UUID } from "@types";
import { libraryApi } from "@api";
import { Link } from "react-router-dom";
import EntityItem from "@components/EntityItem/EntityItem";

export interface RecentlyPlayedListProps {
  userId: UUID;
  accessContext: AccessContext;
}

const RecentlyPlayedList: React.FC<RecentlyPlayedListProps> = ({
  userId,
  accessContext,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      recentlyPlayed: () =>
        libraryApi.getSongHistory(userId, accessContext, {
          timeRange: "1 month",
          limit: 5,
        }),
    },
    [userId],
    {
      cacheKey: `home_recently_played_${userId}`,
      hasBlobUrl: true,
    }
  );

  const recentlyPlayed = data?.recentlyPlayed;

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
    return (
      <div className={styles.error}>Failed to load recently played songs.</div>
    );
  }

  if (!recentlyPlayed || recentlyPlayed.length === 0) {
    return (
      <div className={styles.error}>No recently played songs available.</div>
    );
  }

  return (
    <div className={styles.recentlyPlayedContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Recently Played Tracks</span>
        <Link to="/library/recent" className={styles.viewMoreLink}>
          View More
        </Link>
      </div>

      <div className={styles.recentlyPlayedList}>
        {recentlyPlayed.map((song: Song) => (
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
            size="medium"
          />
        ))}
      </div>
    </div>
  );
};

export default memo(RecentlyPlayedList);
