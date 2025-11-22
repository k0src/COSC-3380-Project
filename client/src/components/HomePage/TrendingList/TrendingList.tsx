import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { adminApi } from "@api";
import type { AccessContext, Song } from "@types";
import { useAsyncData } from "@hooks";
import { getMainArtist } from "@util";
import { EntityItem } from "@components";
import styles from "./TrendingList.module.css";

export interface TrendingListProps {
  accessContext: AccessContext;
}

const TrendingList: React.FC<TrendingListProps> = ({ accessContext }) => {
  const { data, loading, error } = useAsyncData(
    {
      trending: () =>
        adminApi.getTrendingSongs(accessContext, {
          orderByColumn: "streams",
          includeAlbums: true,
          includeArtists: true,
          orderByDirection: "DESC",
          limit: 5,
        }),
    },
    [],
    {
      cacheKey: `home_trending_songs`,
      hasBlobUrl: true,
    }
  );

  const trending = data?.trending;

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
    return <div className={styles.error}>Failed to load trending songs.</div>;
  }

  if (!trending || trending.length === 0) {
    return <div className={styles.error}>No trending songs available.</div>;
  }

  return (
    <div className={styles.trendingContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Trending</span>
        <Link to="/library/recent" className={styles.viewMoreLink}>
          View More
        </Link>
      </div>

      <div className={styles.trendingList}>
        {trending.map((song: Song) => (
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

export default memo(TrendingList);
