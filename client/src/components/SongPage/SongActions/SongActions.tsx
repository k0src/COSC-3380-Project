import React, { memo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "@api";
import type { Song } from "@types";
import { useAuth } from "@contexts";
import { ShareModal, QueueMenu } from "@components";
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
  const navigate = useNavigate();
  const queueButtonRef = useRef<HTMLButtonElement>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [queueMenuOpen, setQueueMenuOpen] = useState(false);

  const fetchLikeStatus = useCallback(async () => {
    if (isAuthenticated && user && song.id) {
      try {
        const response = await userApi.checkLikeStatus(
          user.id,
          song.id,
          "song"
        );
        setIsLiked(response.isLiked);
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      }
    }
  }, [isAuthenticated, user, song.id]);

  useEffect(() => {
    fetchLikeStatus();
  }, [fetchLikeStatus]);

  const handleToggleSongLike = async () => {
    try {
      if (isAuthenticated) {
        await userApi.toggleLike(user!.id, song.id, "song");
        setIsLiked((prev) => !prev);
      } else {
        navigate("/login");
      }
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
            song={song}
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
