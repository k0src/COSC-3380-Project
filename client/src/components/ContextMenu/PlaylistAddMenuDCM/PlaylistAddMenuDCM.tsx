import { memo, useEffect, useRef, useCallback } from "react";
import type { UUID } from "@types";
import { libraryApi, playlistApi } from "@api";
import { useAsyncData } from "@hooks";
import { useAuth } from "@contexts";
import styles from "./PlaylistAddMenuDCM.module.css";

interface PlaylistAddMenuDCMProps {
  isOpen: boolean;
  position: { x: number; y: number };
  songId: UUID;
  onClose: () => void;
}

const PlaylistAddMenuDCM: React.FC<PlaylistAddMenuDCMProps> = ({
  isOpen,
  position,
  songId,
  onClose,
}) => {
  const { user } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  const { data, loading, error } = useAsyncData(
    {
      playlists: () =>
        libraryApi.getLibraryPlaylists(user?.id || "", { omitLikes: true }),
    },
    [user?.id],
    {
      cacheKey: `playlist_add_menu_${user?.id}`,
    }
  );

  const playlists = data?.playlists ?? [];

  const handleAddToPlaylist = useCallback(
    async (playlistId: UUID) => {
      try {
        await playlistApi.addSongs(playlistId, [songId]);
        onClose();
      } catch (error) {
        console.error("Error adding song to playlist:", error);
        onClose();
      }
    },
    [songId, onClose]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [isOpen, handleClickOutside, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={styles.playlistAddMenu}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {loading ? (
        <div className={styles.loading}>Loading playlists...</div>
      ) : playlists.length === 0 ? (
        <div className={styles.emptyState}>No playlists found</div>
      ) : error ? (
        <div className={styles.emptyState}>Error loading playlists.</div>
      ) : (
        <div className={styles.playlistList}>
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              className={styles.playlistItem}
              onClick={() => handleAddToPlaylist(playlist.id)}
            >
              <span className={styles.playlistName}>{playlist.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(PlaylistAddMenuDCM);
