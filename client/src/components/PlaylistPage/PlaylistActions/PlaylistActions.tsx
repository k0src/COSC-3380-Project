import { memo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Playlist, UUID } from "@types";
import { useAuth } from "@contexts";
import { useLikeStatus } from "@hooks";
import { QueueMenu, ShareModal, RemixDialog, ReportModal } from "@components";
import { playlistApi } from "@api";
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
  const [isRemixDialogOpen, setIsRemixDialogOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [isRemixing, setIsRemixing] = useState(false);
  const [remixedPlaylistId, setRemixedPlaylistId] = useState<UUID | null>(null);
  const [remixedPlaylistTitle, setRemixedPlaylistTitle] = useState<string>("");

  const queueButtonRef = useRef<HTMLButtonElement>(null);
  const remixButtonRef = useRef<HTMLButtonElement>(null);

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

  const handleReport = useCallback(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setReportModalOpen(true);
  }, [isAuthenticated, navigate]);

  const handleRemixClick = useCallback(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    if (isRemixDialogOpen) {
      setIsRemixDialogOpen(false);
      setIsRemixing(false);
      setRemixedPlaylistId(null);
      setRemixedPlaylistTitle("");
    } else {
      setIsRemixDialogOpen(true);
      setIsRemixing(false);
      setRemixedPlaylistId(null);
      setRemixedPlaylistTitle("");
    }
  }, [isAuthenticated, user, navigate, isRemixDialogOpen]);

  const handleRemix = useCallback(async () => {
    try {
      if (!user) return;

      setIsRemixing(true);

      const remixedId = await playlistApi.createRemixPlaylist(
        playlist.id,
        user.id,
        20
      );

      setRemixedPlaylistId(remixedId);
      setRemixedPlaylistTitle(`${playlist.title} - Remix`);
      setIsRemixing(false);
    } catch (error) {
      console.error("Remixing playlist failed:", error);
      setIsRemixing(false);
    }
  }, [user, playlist.id, playlist.title]);

  const handleCloseRemixDialog = useCallback(() => {
    setIsRemixDialogOpen(false);
    setIsRemixing(false);
    setRemixedPlaylistId(null);
    setRemixedPlaylistTitle("");
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
        <div className={styles.remixButtonContainer}>
          <button
            ref={remixButtonRef}
            className={styles.remixButton}
            onClick={handleRemixClick}
          >
            <LuListRestart />
          </button>
          <RemixDialog
            isOpen={isRemixDialogOpen}
            isLoading={isRemixing}
            playlistTitle={remixedPlaylistTitle}
            playlistId={remixedPlaylistId}
            onClose={handleCloseRemixDialog}
            onRemix={handleRemix}
            buttonRef={remixButtonRef}
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
        onClose={handleCloseShareModal}
        pageUrl={window.location.href}
        pageTitle={playlist.title}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportedId={playlist.id}
        reportedTitle={playlist.title}
        reportedType="playlist"
      />
    </>
  );
};

export default memo(PlaylistActions);
