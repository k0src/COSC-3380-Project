import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { Link } from "react-router-dom";
import type { UUID, TopListener } from "@types";
import { pluralize } from "@util";
import { useAsyncData } from "@hooks";
import { LazyImg } from "@components";
import { statsApi } from "@api";
import styles from "./ArtistDashboardTopListeners.module.css";
import userPlaceholder from "@assets/user-placeholder.webp";

export interface ArtistDashboardTopListenersProps {
  artistId: UUID;
}

interface TopListenerItemProps {
  userId: UUID;
  imageUrl: string;
  blurhash?: string;
  username: string;
  streams: number;
  topSongTitle: string;
}

const TopListenerItem: React.FC<TopListenerItemProps> = ({
  userId,
  imageUrl,
  blurhash,
  username,
  streams,
  topSongTitle,
}) => {
  return (
    <Link to={`/users/${userId}`} className={styles.topListenerItem}>
      <div className={styles.topListenerLeft}>
        <LazyImg
          src={imageUrl}
          alt={username}
          imgClassNames={[styles.topListenerImage]}
          blurHash={blurhash}
        />
        <div className={styles.topListenerInfo}>
          <span className={styles.topListenerTitle}>{username}</span>
          <span className={styles.topListenerTopSong}>
            Top Song: {topSongTitle}
          </span>
        </div>
      </div>
      <span className={styles.topListenerStreams}>
        {streams} {pluralize(streams, "stream")}
      </span>
    </Link>
  );
};

const ArtistDashboardTopListeners: React.FC<
  ArtistDashboardTopListenersProps
> = ({ artistId }) => {
  const { data, loading, error } = useAsyncData(
    {
      topListeners: () =>
        statsApi.getArtistTopListeners(artistId, {
          timeRange: "30d",
          limit: 5,
        }),
    },
    [artistId],
    {
      cacheKey: `artist_top_listeners_${artistId}`,
      hasBlobUrl: true,
    }
  );

  const topListeners = data?.topListeners ?? [];

  return (
    <div className={styles.topListenersContainer}>
      <span className={styles.topListenersTitle}>
        Your Top Listeners of the Month
      </span>
      {loading ? (
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      ) : error ? (
        <div className={styles.error}>Failed to load top listeners.</div>
      ) : (
        <div className={styles.topListenersList}>
          {topListeners.map((listener: TopListener) => (
            <TopListenerItem
              key={listener.id}
              userId={listener.id}
              imageUrl={listener.profile_picture_url || userPlaceholder}
              blurhash={listener.pfp_blurhash}
              username={listener.username}
              streams={listener.streams ?? 0}
              topSongTitle={listener.top_song_title}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(ArtistDashboardTopListeners);
