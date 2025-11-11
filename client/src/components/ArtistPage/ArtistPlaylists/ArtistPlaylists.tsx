import { memo } from "react";
import { PuffLoader } from "react-spinners";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
import { artistApi } from "@api";
import { EntityItem } from "@components";
import styles from "./ArtistPlaylists.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

export interface ArtistPlaylistsProps {
  artistId: UUID;
  artistName: string;
}

const ArtistPlaylists: React.FC<ArtistPlaylistsProps> = ({
  artistId,
  artistName,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      playlists: () =>
        artistApi.getPlaylists(artistId, { includeUser: true, limit: 10 }),
    },
    [artistId],
    {
      cacheKey: `artist_playlists_${artistId}`,
      hasBlobUrl: true,
    }
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Failed to load playlists.</div>;
  }

  const playlists = data?.playlists;

  if (!playlists || playlists.length === 0) {
    return null;
  }

  return (
    <div className={styles.playlistsContainer}>
      <span className={styles.sectionTitle}>
        Playlists Featuring {artistName}
      </span>
      <div className={styles.playlistsList}>
        {data?.playlists?.map((playlist) => (
          <EntityItem
            key={playlist.id}
            type="playlist"
            author={playlist.user?.username || "Unknown"}
            linkTo={`/playlists/${playlist.id}`}
            title={playlist.title}
            imageUrl={playlist.image_url || musicPlaceholder}
            //! blurHash={playlist.image_url_blurhash}
            entity={playlist}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(ArtistPlaylists);
