import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { Link } from "react-router-dom";
import type { Playlist, UUID } from "@types";
import { pluralize } from "@util";
import { useAsyncData } from "@hooks";
import { LazyImg } from "@components";
import { statsApi } from "@api";
import styles from "./ArtistDashboardTopPlaylists.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

interface PlaylistWithStreams extends Playlist {
  total_streams: number;
}

export interface ArtistDashboardTopPlaylistsProps {
  artistId: UUID;
}

interface TopPlaylistItemProps {
  playlistId: UUID;
  imageUrl: string;
  blurhash?: string;
  title: string;
  totalStreams: number;
  songCount: number;
}

const TopPlaylistItem: React.FC<TopPlaylistItemProps> = ({
  playlistId,
  imageUrl,
  blurhash,
  title,
  totalStreams,
  songCount,
}) => {
  return (
    <Link to={`/playlists/${playlistId}`} className={styles.topPlaylistItem}>
      <div className={styles.topPlaylistLeft}>
        <LazyImg
          src={imageUrl}
          alt={title}
          imgClassNames={[styles.topPlaylistImage]}
          blurHash={blurhash}
        />
        <div className={styles.topPlaylistInfo}>
          <span className={styles.topPlaylistTitle}>{title}</span>
          <span className={styles.topPlaylistSongCount}>
            {songCount} {pluralize(songCount, "song")}
          </span>
        </div>
      </div>
      <span className={styles.topPlaylistStreams}>
        {totalStreams} {pluralize(totalStreams, "stream")}
      </span>
    </Link>
  );
};

const ArtistDashboardTopPlaylists: React.FC<
  ArtistDashboardTopPlaylistsProps
> = ({ artistId }) => {
  const { data, loading, error } = useAsyncData(
    {
      topPlaylists: () =>
        statsApi.getArtistTopPlaylists(artistId, {
          timeRange: "30d",
          limit: 5,
        }),
    },
    [artistId],
    {
      cacheKey: `artist_dashboard_top_playlists_${artistId}`,
      hasBlobUrl: true,
    }
  );

  const topPlaylists = data?.topPlaylists ?? [];

  return (
    <div className={styles.topPlaylistsContainer}>
      <span className={styles.topPlaylistsTitle}>
        Top Playlists Featuring You
      </span>
      {loading ? (
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      ) : error ? (
        <div className={styles.error}>Failed to load top playlists.</div>
      ) : (
        <div className={styles.topPlaylistsList}>
          {topPlaylists.map((playlist: PlaylistWithStreams) => (
            <TopPlaylistItem
              key={playlist.id}
              playlistId={playlist.id}
              imageUrl={playlist.image_url || musicPlaceholder}
              blurhash={playlist.image_url_blurhash}
              title={playlist.title}
              totalStreams={playlist.total_streams}
              songCount={playlist.song_count ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(ArtistDashboardTopPlaylists);
