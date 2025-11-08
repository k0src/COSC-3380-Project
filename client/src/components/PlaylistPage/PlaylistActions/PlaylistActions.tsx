import { memo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Playlist } from "@types";
import { useAuth } from "@contexts";
import { useLikeStatus } from "@hooks";
import { QueueMenu, ShareModal } from "@components";
import {
  LuThumbsUp,
  LuListEnd,
  LuListRestart,
  LuShare,
  LuCircleAlert,
} from "react-icons/lu";
import styles from "./PlaylistActions.module.css";
import classNames from "classnames";

export interface PlaylistActionsProps {
  playlist: Playlist;
}

const PlaylistActions: React.FC<PlaylistActionsProps> = ({ playlist }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    isLiked,
    toggleLike,
    isLoading: isLikeLoading,
  } = useLikeStatus({
    userId: user?.id || "",
    entityId: playlist.id,
    entityType: "playlist",
    isAuthenticated,
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [queueMenuOpen, setQueueMenuOpen] = useState(false);

  const queueButtonRef = useRef<HTMLButtonElement>(null);

  const handleTogglePlaylistLike = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }
      await toggleLike();
    } catch (error) {
      console.error("Toggling playlist like failed:", error);
    }
  }, [isAuthenticated, navigate, toggleLike]);

  const handleAddToQueue = useCallback(() => {
    try {
      if (isAuthenticated) {
        setQueueMenuOpen((prev) => !prev);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding to queue failed:", error);
    }
  }, [isAuthenticated, navigate]);

  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const handleReport = useCallback(async () => {
    //!: open report modal...
  }, []);

  const handleRemix = useCallback(async () => {
    //!: open remix modal...
  }, []);

  const handleCloseQueueMenu = useCallback(() => setQueueMenuOpen(false), []);
  const handleCloseShareModal = useCallback(
    () => setIsShareModalOpen(false),
    []
  );

  return (
    <>
      <div className={styles.actionContainer}>
        <button
          className={classNames(styles.actionButton, {
            [styles.actionButtonActive]: isLiked,
          })}
          disabled={isLikeLoading}
          onClick={handleTogglePlaylistLike}
        >
          <LuThumbsUp />
        </button>
        <div className={styles.queueButtonContainer}>
          <button
            ref={queueButtonRef}
            className={styles.actionButton}
            onClick={handleAddToQueue}
          >
            <LuListEnd />
          </button>
          <QueueMenu
            isOpen={queueMenuOpen}
            onClose={handleCloseQueueMenu}
            entityType="list"
            entity={playlist}
            buttonRef={queueButtonRef}
          />
        </div>
        <button className={styles.remixButton} onClick={handleRemix}>
          <LuListRestart />
        </button>
        <button className={styles.actionButton} onClick={handleShare}>
          <LuShare />
        </button>
        <button className={styles.actionButton} onClick={handleReport}>
          <LuCircleAlert />
        </button>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        pageUrl={window.location.href}
        pageTitle={playlist.title}
      />
    </>
  );
};

export default memo(PlaylistActions);
