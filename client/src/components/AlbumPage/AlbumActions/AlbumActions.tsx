import React, { memo, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Album } from "@types";
import { useLikeStatus } from "@hooks";
import { useAuth } from "@contexts";
import { ShareModal, QueueMenu } from "@components";
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
}

const AlbumActions: React.FC<AlbumActionsProps> = ({ album, albumUrl }) => {
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

  const queueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user?.id && album?.id) {
      queryClient.invalidateQueries({
        queryKey: ["likeStatus", user.id, album.id, "album"],
      });
    }
  }, [user?.id, album?.id, queryClient]);

  const handleToggleAlbumLike = async () => {
    try {
      if (!isAuthenticated) return navigate("/login");
      await toggleLike();
    } catch (error) {
      console.error("Toggling album like failed:", error);
    }
  };

  const handleAddToQueue = async () => {
    try {
      if (isAuthenticated) {
        setQueueMenuOpen((prev) => !prev);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding to queue failed:", error);
    }
  };

  const handleAddToPlaylist = async () => {
    try {
      if (isAuthenticated) {
        //! open add to playlist modal...
        console.log("Add album to playlist: " + album.id);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding to playlist failed:", error);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleReport = () => {
    //! open report modal...
  };

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
          />
        </div>
        <button className={styles.actionButton} onClick={handleAddToPlaylist}>
          <LuListPlus />
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
        onClose={() => setIsShareModalOpen(false)}
        pageUrl={albumUrl}
        pageTitle={album.title}
      />
    </>
  );
};

export default memo(AlbumActions);
