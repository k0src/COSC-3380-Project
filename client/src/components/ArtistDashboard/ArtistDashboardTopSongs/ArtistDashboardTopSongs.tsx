import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { Link } from "react-router-dom";
import type { Song, UUID } from "@types";
import { formatRelativeDate, pluralize } from "@util";
import { useAsyncData } from "@hooks";
import { LazyImg } from "@components";
import { statsApi } from "@api";
import styles from "./ArtistDashboardTopSongs.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

export interface ArtistDashboardTopSongsProps {
  artistId: UUID;
}

interface TopSongItemProps {
  songId: UUID;
  imageUrl: string;
  blurhash?: string;
  title: string;
  streams: number;
  releaseDate: string;
}

const TopSongItem: React.FC<TopSongItemProps> = ({
  songId,
  imageUrl,
  blurhash,
  title,
  streams,
  releaseDate,
}) => {
  return (
    <Link to={`/songs/${songId}`} className={styles.topSongItem}>
      <div className={styles.topSongLeft}>
        <LazyImg
          src={imageUrl}
          alt={title}
          imgClassNames={[styles.topSongImage]}
          blurHash={blurhash}
        />
        <div className={styles.topSongInfo}>
          <span className={styles.topSongTitle}>{title}</span>
          <span className={styles.topSongDate}>
            {formatRelativeDate(releaseDate)}
          </span>
        </div>
      </div>
      <span className={styles.topSongStreams}>
        {streams} {pluralize(streams, "stream")}
      </span>
    </Link>
  );
};

const ArtistDashboardTopSongs: React.FC<ArtistDashboardTopSongsProps> = ({
  artistId,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      topSongs: () =>
        statsApi.getArtistTopSongs(artistId, {
          timeRange: "30d",
          limit: 5,
        }),
    },
    [artistId],
    {
      cacheKey: `artist_dashboard_top_songs_${artistId}`,
      hasBlobUrl: true,
    }
  );

  const topSongs = data?.topSongs ?? [];

  return (
    <div className={styles.topSongsContainer}>
      <span className={styles.topSongsTitle}>Your Top Songs of the Month</span>
      {loading ? (
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      ) : error ? (
        <div className={styles.error}>Failed to load top songs.</div>
      ) : (
        <div className={styles.topSongsList}>
          {topSongs.map((song: Song) => (
            <TopSongItem
              key={song.id}
              songId={song.id}
              imageUrl={song.image_url || musicPlaceholder}
              blurhash={song.image_url_blurhash}
              title={song.title}
              streams={song.streams ?? 0}
              releaseDate={song.release_date}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(ArtistDashboardTopSongs);
