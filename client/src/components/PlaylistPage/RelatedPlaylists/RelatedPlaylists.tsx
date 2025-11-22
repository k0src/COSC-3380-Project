import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import type { UUID, AccessContext } from "@types";
import { useAsyncData } from "@hooks";
import { useAuth } from "@contexts";
import type { Playlist } from "@types";
import { playlistApi, userApi } from "@api";
import { EntityItem } from "@components";
import styles from "./RelatedPlaylists.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
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
  const { user } = useAuth();

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "globalList",
  };

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
          userApi.getPlaylists(userId, accessContext, {
            includeSongCount: true,
            limit: 10,
          });
      default:
        throw new Error(`Invalid mode: ${mode}`);
    }
  };

  const { data, loading, error } = useAsyncData(
    {
      playlists: getApiFn(),
    },
    [userId, playlistId, mode, user?.id],
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

  const playlistAuthor = useMemo(() => {
    if (mode === "related") {
      return (playlist: Playlist) => playlist.user?.username || "Unknown";
    } else {
      return (playlist: Playlist) =>
        `${playlist.song_count ?? 0} ${pluralize(
          playlist.song_count ?? 0,
          "song"
        )}`;
    }
  }, [mode]);

  const playlistAuthorLink = useMemo(() => {
    if (mode === "related") {
      return (playlist: Playlist) =>
        playlist.user ? `/users/${playlist.user.id}` : undefined;
    } else {
      return undefined;
    }
  }, [mode]);

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

  if (!filteredPlaylists || filteredPlaylists.length === 0) {
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
            type="playlist"
            author={playlistAuthor(playlist)}
            authorLinkTo={playlistAuthorLink?.(playlist)}
            linkTo={`/playlists/${playlist.id}`}
            title={playlist.title}
            imageUrl={playlist.image_url || musicPlaceholder}
            blurHash={playlist.image_url_blurhash}
            entity={playlist}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(RelatedPlaylists);
