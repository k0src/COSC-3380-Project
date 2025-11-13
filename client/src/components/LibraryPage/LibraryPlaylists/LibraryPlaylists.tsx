import { memo, useMemo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID } from "@types";
import { EntityItemCard } from "@components";
import { libraryApi } from "@api";
import { useAsyncData } from "@hooks";
import styles from "./LibraryPlaylists.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import { LuPin } from "react-icons/lu";

const LibraryPlaylists: React.FC<{
  userId: UUID;
  searchFilter?: string;
}> = ({ userId, searchFilter = "" }) => {
  const { data, loading, error } = useAsyncData(
    {
      playlists: () => libraryApi.getLibraryPlaylists(userId),
    },
    [userId],
    {
      cacheKey: `library_playlists_${userId}`,
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

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={50} />
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
            : "No liked playlists yet."}
        </span>
      ) : (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>My Playlists</span>
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

export default memo(LibraryPlaylists);
