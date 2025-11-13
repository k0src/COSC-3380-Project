import { memo, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@types";
import { useAuth } from "@contexts";
import { useFollowStatus } from "@hooks";
import { LazyImg } from "@components";
import { LuUserRoundCheck, LuUserRoundPlus } from "react-icons/lu";
import styles from "./PlaylistUser.module.css";
import classNames from "classnames";
import userPlaceholder from "@assets/user-placeholder.webp";
import { useQueryClient } from "@tanstack/react-query";

export interface PlaylistUserProps {
  user: User;
}

const PlaylistUser: React.FC<PlaylistUserProps> = ({ user }) => {
  const { isAuthenticated, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    isFollowed,
    toggleFollow,
    isLoading: isFollowLoading,
  } = useFollowStatus({
    userId: currentUser?.id || "",
    followingUserId: user?.id || "",
    isAuthenticated,
  });

  useEffect(() => {
    if (currentUser?.id && user?.id) {
      queryClient.invalidateQueries({
        queryKey: ["followStatus", currentUser.id, user.id],
      });
    }
  }, [currentUser?.id, user?.id, queryClient]);

  const profilePicUrl = useMemo(
    () => user.profile_picture_url || userPlaceholder,
    [user.profile_picture_url]
  );

  const handleFollow = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }
      await toggleFollow();
    } catch (error) {
      console.error("Toggling follow user failed:", error);
    }
  }, [isAuthenticated, navigate, toggleFollow]);

  return (
    <div className={styles.userContainer}>
      <LazyImg
        src={profilePicUrl}
        blurHash={user.pfp_blurhash}
        alt={`${user.username} Image`}
        imgClassNames={[styles.userProfilePicture]}
        onClick={handleFollow}
      />
      <div className={styles.usernameContainer}>
        <Link className={styles.usernameText} to={`/users/${user.id}`}>
          {user.username}
        </Link>
        <button
          className={classNames(styles.followButton, {
            [styles.followButtonActive]: isFollowed,
          })}
          disabled={isFollowLoading}
          onClick={handleFollow}
        >
          {isFollowed ? <LuUserRoundCheck /> : <LuUserRoundPlus />}
        </button>
      </div>
    </div>
  );
};

export default memo(PlaylistUser);
