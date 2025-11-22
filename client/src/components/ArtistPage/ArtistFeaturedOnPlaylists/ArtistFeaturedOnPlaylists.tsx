import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { useAuth } from "@contexts";
import type { UUID, Playlist, AccessContext } from "@types";
import { useAsyncData } from "@hooks";
import { artistApi } from "@api";
import { EntityItem } from "@components";
import styles from "./ArtistFeaturedOnPlaylists.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

export interface ArtistFeaturedOnPlaylistsProps {
  artistId: UUID;
  artistName: string;
}

const ArtistFeaturedOnPlaylists: React.FC<ArtistFeaturedOnPlaylistsProps> = ({
  artistId,
  artistName,
}) => {
  const { user } = useAuth();

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "globalList",
  };

  const { data, loading, error } = useAsyncData(
    {
      playlists: () =>
        artistApi.getPlaylists(artistId, accessContext, {
          includeUser: true,
          limit: 10,
        }),
    },
    [artistId],
    {
      cacheKey: `artist_playlists_${artistId}`,
      hasBlobUrl: true,
    }
  );

  const playlistAuthor = useMemo(
    () => (playlist: Playlist) => playlist.user?.username || "Unknown",
    []
  );

  const playlistAuthorLink = useMemo(
    () => (playlist: Playlist) =>
      playlist.user ? `/users/${playlist.user.id}` : undefined,
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
        {playlists.map((playlist) => (
          <EntityItem
            key={playlist.id}
            type="playlist"
            author={playlistAuthor(playlist)}
            authorLinkTo={playlistAuthorLink(playlist)}
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

export default memo(ArtistFeaturedOnPlaylists);
