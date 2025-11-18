import { memo, useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Album, UUID } from "@types";
import { useLikeStatus } from "@hooks";
import { useAuth } from "@contexts";
import {
  ShareModal,
  QueueMenu,
  PlaylistAddMenu,
  ReportModal,
} from "@components";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./AlbumActions.module.css";
import classNames from "classnames";
import {
  LuThumbsUp,
  LuListEnd,
  LuListPlus,
  LuShare,
  LuCircleAlert,
} from "react-icons/lu";

export interface AlbumActionsProps {
  album: Album;
  albumUrl?: string;
  songIds: UUID[];
}

const AlbumActions: React.FC<AlbumActionsProps> = ({
  album,
  albumUrl,
  songIds,
}) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    isLiked,
    toggleLike,
    isLoading: isLikeLoading,
  } = useLikeStatus({
    userId: user?.id || "",
    entityId: album.id,
    entityType: "album",
    isAuthenticated,
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [queueMenuOpen, setQueueMenuOpen] = useState(false);
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const queueButtonRef = useRef<HTMLButtonElement>(null);
  const playlistButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user?.id && album?.id) {
      queryClient.invalidateQueries({
        queryKey: ["likeStatus", user.id, album.id, "album"],
      });
    }
  }, [user?.id, album?.id, queryClient]);

  const handleToggleAlbumLike = useCallback(async () => {
    try {
      if (!isAuthenticated) return navigate("/login");
      await toggleLike();
    } catch (error) {
      console.error("Toggling album like failed:", error);
    }
  }, [isAuthenticated, navigate, toggleLike]);

  const handleAddToQueue = useCallback(async () => {
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

  const handleAddToPlaylist = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }
      setPlaylistMenuOpen((prev) => !prev);
    } catch (error) {
      console.error("Adding to playlist failed:", error);
    }
  }, [isAuthenticated, navigate]);

  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const handleReport = useCallback(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setReportModalOpen(true);
  }, [isAuthenticated, navigate]);

  return (
    <>
      <div className={styles.albumActionsContainer}>
        <button
          className={classNames(styles.actionButton, {
            [styles.actionButtonActive]: isLiked,
          })}
          disabled={isLikeLoading}
          onClick={handleToggleAlbumLike}
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
            onClose={() => setQueueMenuOpen(false)}
            entity={album}
            entityType="list"
            buttonRef={queueButtonRef}
            justification="right"
            position="bottom"
          />
        </div>
        <div className={styles.playlistButtonContainer}>
          <button
            ref={playlistButtonRef}
            className={styles.actionButton}
            onClick={handleAddToPlaylist}
          >
            <LuListPlus />
          </button>
          <PlaylistAddMenu
            isOpen={playlistMenuOpen}
            onClose={() => setPlaylistMenuOpen(false)}
            songIds={songIds}
            buttonRef={playlistButtonRef}
            position="bottom"
          />
        </div>
        <button className={styles.actionButton} onClick={handleShare}>
          <LuShare />
        </button>
        <button className={styles.actionButton} onClick={handleReport}>
          <LuCircleAlert />
        </button>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        pageUrl={albumUrl}
        pageTitle={album.title}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportedId={album.id}
        reportedTitle={album.title}
        reportedType="album"
      />
    </>
  );
};

export default memo(AlbumActions);
