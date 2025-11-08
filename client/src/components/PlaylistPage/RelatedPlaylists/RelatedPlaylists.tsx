import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
import { playlistApi, userApi } from "@api";
import { EntityItem } from "@components";
import styles from "./RelatedPlaylists.module.css";
import musicPlaceholder from "@assets/music-placeholder.png";
import { pluralize } from "@util";

export type RelatedPlaylistsProps =
  | {
      mode: "user";
      userId: UUID;
      username: string;
      playlistId: UUID;
    }
  | {
      mode: "related";
      playlistId: UUID;
      userId?: never;
      username?: never;
    };

const RelatedPlaylists: React.FC<RelatedPlaylistsProps> = ({
  userId,
  username,
  playlistId,
  mode,
}) => {
  const getApiFn = () => {
    switch (mode) {
      case "related":
        return () =>
          playlistApi.getRelatedPlaylists(playlistId, {
            includeUser: true,
            limit: 10,
          });
      case "user":
        return () =>
          userApi.getPlaylists(userId, { includeSongCount: true, limit: 10 });
      default:
        throw new Error(`Invalid mode: ${mode}`);
    }
  };

  const { data, loading, error } = useAsyncData(
    {
      playlists: getApiFn(),
    },
    [userId, playlistId, mode],
    {
      cacheKey:
        mode === "related"
          ? `related_playlists_${playlistId}`
          : `user_playlists_${userId}`,
      hasBlobUrl: true,
    }
  );

  const playlists = data?.playlists;
  const filteredPlaylists = useMemo(
    () => playlists?.filter((playlist) => playlist.id !== playlistId) ?? [],
    [playlists, playlistId]
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

  if (!playlists || playlists.length === 0) {
    return null;
  }

  return (
    <div className={styles.playlistsContainer}>
      <span className={styles.sectionTitle}>
        {mode === "related"
          ? "Related Playlists"
          : `More Playlists by ${username}`}
      </span>
      <div className={styles.playlistsList}>
        {filteredPlaylists.map((playlist) => (
          <EntityItem
            key={playlist.id}
            type="list"
            author={
              mode === "related"
                ? playlist.user?.username || "Unknown"
                : `${playlist.song_count ?? 0} ${pluralize(
                    playlist.song_count ?? 0,
                    "song"
                  )}`
            }
            linkTo={`/playlists/${playlist.id}`}
            title={playlist.title}
            imageUrl={playlist.image_url || musicPlaceholder}
            entity={playlist}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(RelatedPlaylists);
