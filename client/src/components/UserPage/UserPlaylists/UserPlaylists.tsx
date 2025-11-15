import { memo } from "react";
import { PuffLoader } from "react-spinners";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
import { userApi } from "@api";
import { pluralize } from "@util";
import { EntityItem } from "@components";
import styles from "./UserPlaylists.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

export interface UserPlaylistsProps {
  userId: UUID;
  username: string;
}

const UserPlaylists: React.FC<UserPlaylistsProps> = ({ userId, username }) => {
  const { data, loading, error } = useAsyncData(
    {
      playlists: () =>
        userApi.getPlaylists(userId, { includeSongCount: true, limit: 10 }),
    },
    [userId],
    {
      cacheKey: `artist_playlists_${userId}`,
      hasBlobUrl: true,
    }
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
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
      <span className={styles.sectionTitle}>Playlists By {username}</span>
      <div className={styles.playlistsList}>
        {playlists.map((playlist) => (
          <EntityItem
            key={playlist.id}
            type="playlist"
            author={username}
            authorLinkTo={`/users/${userId}`}
            subtitle={`${playlist.song_count} ${pluralize(
              playlist.song_count ?? 0,
              "song"
            )}`}
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

export default memo(UserPlaylists);
