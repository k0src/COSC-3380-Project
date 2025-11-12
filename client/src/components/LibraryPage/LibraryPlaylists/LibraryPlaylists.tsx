import { memo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID } from "@types";
import { EntityItemCard } from "@components";
import { libraryApi } from "@api";
import { useAsyncData } from "@hooks";
import styles from "./LibraryPlaylists.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import { LuPin } from "react-icons/lu";

const LibraryPlaylists: React.FC<{ userId: UUID }> = ({ userId }) => {
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

  const playlists = data?.playlists || [];

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
      {playlists.length === 0 ? (
        <span className={styles.noPlaylists}>No liked playlists yet.</span>
      ) : (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>My Playlists</span>
          <div className={styles.itemsGrid}>
            {playlists.map((playlist) => (
              <div className={styles.playlistContainer}>
                {playlist.is_pinned && (
                  <div className={styles.pinnedIconContainer}>
                    <LuPin className={styles.pinnedIcon} />
                  </div>
                )}
                <EntityItemCard
                  key={playlist.id}
                  entity={playlist}
                  type="playlist"
                  linkTo={`/playlists/${playlist.id}`}
                  author={playlist.user?.username || "Unknown"}
                  authorLinkTo={`/users/${playlist.user?.id}`}
                  title={playlist.title}
                  subtitle={`${playlist.song_count} songs`}
                  imageUrl={playlist.image_url || musicPlaceholder}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(LibraryPlaylists);
