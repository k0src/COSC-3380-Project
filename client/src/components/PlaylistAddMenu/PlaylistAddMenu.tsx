import { memo, useMemo, useEffect, useRef, useCallback } from "react";
import { LuX } from "react-icons/lu";
import type { UUID } from "@types";
import { libraryApi, playlistApi } from "@api";
import { useAsyncData } from "@hooks";
import { useAuth } from "@contexts";
import styles from "./PlaylistAddMenu.module.css";
import classNames from "classnames";

interface PlaylistAddMenuProps {
  isOpen: boolean;
  onClose: () => void;
  songIds: UUID[];
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  position: "now-playing" | "bottom";
  jusification?: "left" | "center" | "right";
}

const PlaylistAddMenu: React.FC<PlaylistAddMenuProps> = ({
  isOpen,
  onClose,
  songIds,
  buttonRef,
  position,
  jusification = "right",
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
        await playlistApi.addSongs(playlistId, songIds);
        onClose();
      } catch (error) {
        console.error("Error adding song to playlist:", error);
        onClose();
      }
    },
    [songIds, onClose]
  );

  const positionClass = useMemo(() => {
    switch (position) {
      case "now-playing":
        return styles.positionNowPlaying;
      case "bottom":
        return styles.positionBottom;
      default:
        return "";
    }
  }, [position]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={classNames(styles.playlistAddMenu, positionClass, {
        [styles.justifyLeft]: jusification === "left",
        [styles.justifyCenter]: jusification === "center",
        [styles.justifyRight]: jusification === "right",
      })}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Add to Playlist</h3>
        <button className={styles.closeButton} onClick={onClose}>
          <LuX />
        </button>
      </div>

      <div className={styles.playlistContent}>
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
    </div>
  );
};

export default memo(PlaylistAddMenu);
