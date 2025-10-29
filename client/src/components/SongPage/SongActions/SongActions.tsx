import { memo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "@api";
import { useAuth } from "@contexts";
import { ShareModal } from "@components";
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
  songId: string;
  songTitle?: string;
  songUrl?: string;
}

const SongActions: React.FC<SongActionsProps> = ({
  songId,
  songTitle,
  songUrl,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchLikeStatus = useCallback(async () => {
    if (isAuthenticated && user && songId) {
      try {
        const response = await userApi.checkLikeStatus(user.id, songId, "song");
        setIsLiked(response.isLiked);
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      }
    }
  }, [isAuthenticated, user, songId]);

  useEffect(() => {
    fetchLikeStatus();
  }, [fetchLikeStatus]);

  const handleToggleSongLike = async () => {
    try {
      if (isAuthenticated) {
        await userApi.toggleLike(user!.id, songId, "song");
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
        console.log("added to playlist: " + songId);
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
        //! send request here
        console.log("added to queue: " + songId);
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
        <button className={styles.actionButton} onClick={handleAddToQueue}>
          <LuListEnd />
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
        pageUrl={songUrl}
        pageTitle={songTitle}
      />
    </>
  );
};

export default memo(SongActions);
