import React, { memo, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Song } from "@types";
import { useLikeStatus } from "@hooks";
import { useAuth } from "@contexts";
import { ShareModal, QueueMenu } from "@components";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./SongActions.module.css";
import classNames from "classnames";
import {
  LuThumbsUp,
  LuListPlus,
  LuListEnd,
  LuShare,
  LuCircleAlert,
} from "react-icons/lu";

export interface SongActionsProps {
  song: Song;
  songUrl?: string;
}

const SongActions: React.FC<SongActionsProps> = ({ song, songUrl }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    isLiked,
    toggleLike,
    isLoading: isLikeLoading,
  } = useLikeStatus({
    userId: user?.id || "",
    entityId: song.id,
    entityType: "song",
    isAuthenticated,
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [queueMenuOpen, setQueueMenuOpen] = useState(false);

  const queueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user?.id && song?.id) {
      queryClient.invalidateQueries({
        queryKey: ["likeStatus", user.id, song.id, "song"],
      });
    }
  }, [user?.id, song?.id]);

  const handleToggleSongLike = async () => {
    try {
      if (!isAuthenticated) return navigate("/login");
      await toggleLike();
    } catch (error) {
      console.error("Toggling song like failed:", error);
    }
  };

  const handleAddToPlaylist = async () => {
    try {
      if (isAuthenticated) {
        //! send request here
        console.log("added to playlist: " + song.id);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding to playlist failed:", error);
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

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleReport = () => {
    //! open report modal...
  };

  return (
    <>
      <div className={styles.songActionsContainer}>
        <button
          className={classNames(styles.actionButton, {
            [styles.actionButtonActive]: isLiked,
          })}
          disabled={isLikeLoading}
          onClick={handleToggleSongLike}
        >
          <LuThumbsUp />
        </button>
        <button className={styles.actionButton} onClick={handleAddToPlaylist}>
          <LuListPlus />
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
            entity={song}
            entityType="song"
            buttonRef={queueButtonRef}
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
        pageUrl={songUrl}
        pageTitle={song.title}
      />
    </>
  );
};

export default memo(SongActions);
