import { memo, useMemo, useEffect } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID } from "@types";
import { EntityItemCard } from "@components";
import { libraryApi } from "@api";
import { useAsyncData } from "@hooks";
import styles from "./HistoryPlaylists.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import { LuPin } from "react-icons/lu";

const HistoryPlaylists: React.FC<{
  userId: UUID;
  searchFilter?: string;
  onRefetchNeeded?: React.RefObject<(() => void) | null>;
}> = ({ userId, searchFilter = "", onRefetchNeeded }) => {
  const { data, loading, error, refetch } = useAsyncData(
    {
      playlists: () =>
        libraryApi.getPlaylistHistory(userId, { timeRange: "1 month" }),
    },
    [userId],
    {
      cacheKey: `history_playlists_${userId}`,
      hasBlobUrl: true,
    }
  );

  const playlists = data?.playlists ?? [];

  const filteredPlaylists = useMemo(() => {
    if (!searchFilter.trim()) {
      return playlists;
    }

    const lowerFilter = searchFilter.toLowerCase();
    return playlists.filter((playlist) =>
      playlist.title.toLowerCase().includes(lowerFilter)
    );
  }, [playlists, searchFilter]);

  useEffect(() => {
    if (onRefetchNeeded) {
      onRefetchNeeded.current = refetch;
    }
  }, [refetch, onRefetchNeeded]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading playlists.</div>;
  }

  return (
    <>
      {filteredPlaylists.length === 0 ? (
        <span className={styles.noPlaylists}>
          {searchFilter.trim()
            ? "No playlists match your search."
            : "You haven't listened to any playlists yet."}
        </span>
      ) : (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Playlist History</span>
          <div className={styles.itemsGrid}>
            {filteredPlaylists.map((playlist) => (
              <div key={playlist.id} className={styles.playlistContainer}>
                <EntityItemCard
                  entity={playlist}
                  type="playlist"
                  linkTo={`/playlists/${playlist.id}`}
                  author={playlist.user?.username || "Unknown"}
                  authorLinkTo={
                    playlist.user?.id ? `/users/${playlist.user.id}` : undefined
                  }
                  title={playlist.title}
                  subtitle={`${playlist.song_count} songs`}
                  imageUrl={playlist.image_url || musicPlaceholder}
                  blurHash={playlist.image_url_blurhash}
                />
                {playlist.is_pinned && (
                  <div className={styles.pinnedIconContainer}>
                    <LuPin className={styles.pinnedIcon} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(HistoryPlaylists);
