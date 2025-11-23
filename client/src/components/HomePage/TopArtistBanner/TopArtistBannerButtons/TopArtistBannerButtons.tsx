import { memo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { useAudioQueue } from "@contexts";
import { useFollowStatus } from "@hooks";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./TopArtistBannerButtons.module.css";
import type { UUID } from "@types";
import classNames from "classnames";
import {
  LuCirclePlay,
  LuUserRoundPlus,
  LuUserRoundCheck,
} from "react-icons/lu";

export interface TopArtistBannerButtonsProps {
  userId: UUID;
  artistId: UUID;
}

const TopArtistBannerButtons: React.FC<TopArtistBannerButtonsProps> = ({
  userId,
  artistId,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { actions } = useAudioQueue();
  const queryClient = useQueryClient();

  const {
    isFollowed,
    toggleFollow,
    isLoading: isFollowLoading,
  } = useFollowStatus({
    userId: user?.id || "",
    followingUserId: userId,
    isAuthenticated,
  });

  useEffect(() => {
    if (user?.id && userId) {
      queryClient.invalidateQueries({
        queryKey: ["followStatus", user.id, userId],
      });
    }
  }, [user?.id, userId, queryClient]);

  const handleFollowArtist = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }
      await toggleFollow();
    } catch (error) {
      console.error("Toggling follow artist failed:", error);
    }
  }, [isAuthenticated, navigate, toggleFollow]);

  const handlePlayAll = useCallback(async () => {
    try {
      await actions.playArtist(artistId);
    } catch (error) {
      console.error("Failed to play artist:", error);
    }
  }, [actions, artistId]);

  return (
    <div className={styles.topArtistButtons}>
      <button onClick={handlePlayAll} className={styles.actionButton}>
        <LuCirclePlay /> Play All
      </button>
      <button
        className={classNames(styles.actionButton, {
          [styles.followed]: isFollowed,
        })}
        disabled={isFollowLoading}
        onClick={handleFollowArtist}
      >
        {isFollowed ? (
          <>
            Followed <LuUserRoundCheck />
          </>
        ) : (
          <>
            Follow <LuUserRoundPlus />
          </>
        )}
      </button>
    </div>
  );
};

export default memo(TopArtistBannerButtons);
