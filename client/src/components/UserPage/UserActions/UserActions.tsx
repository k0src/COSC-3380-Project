import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { useAsyncData, useFollowStatus } from "@hooks";
import { formatNumber, formatRelativeDate } from "@util";
import { userApi } from "@api";
import { ReportModal } from "@components";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./UserActions.module.css";
import classNames from "classnames";
import {
  LuUserRoundPlus,
  LuCircleAlert,
  LuUsersRound,
  LuUserRoundCheck,
  LuEllipsis,
} from "react-icons/lu";

const StatItem = memo(
  ({
    icon: Icon,
    value,
    label,
  }: {
    icon?: React.ElementType;
    value: string;
    label: string;
  }) => (
    <div className={styles.userStat}>
      <div className={Icon ? styles.userStatLargeIcon : styles.userStatLarge}>
        {Icon && <Icon />} {value}
      </div>
      <span className={styles.userStatLabel}>{label}</span>
    </div>
  )
);

export interface UserActionsProps {
  artistId?: string;
  userIsArtist: boolean;
  userCreatedAt: string;
  userId: string;
  username: string;
}

const UserActions: React.FC<UserActionsProps> = ({
  artistId,
  userId,
  userCreatedAt,
  userIsArtist,
  username,
}) => {
  if (userIsArtist && !artistId) {
    throw new Error("artistId is required when userIsArtist is true");
  }

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [reportModalOpen, setReportModalOpen] = useState(false);

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

  const asyncConfig = useMemo(
    () => ({
      followingCount: () => userApi.getFollowingCount(userId),
      followerCount: () => userApi.getFollowerCount(userId),
    }),
    [artistId, userId, userIsArtist]
  );

  const { data, loading, error } = useAsyncData(asyncConfig, [artistId], {
    cacheKey: `user_actions_${userId}`,
    hasBlobUrl: true,
  });

  const stats = useMemo(
    () => ({
      followers: formatNumber(data?.followerCount ?? 0),
      following: formatNumber(data?.followingCount ?? 0),
      joinDate: formatRelativeDate(userCreatedAt),
    }),
    [data]
  );

  const handleFollowUser = useCallback(async () => {
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

  const handleReport = useCallback(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setReportModalOpen(true);
  }, [isAuthenticated, navigate]);

  const handleMore = useCallback(() => {
    navigate(`/users/${userId}/info`);
  }, []);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading user actions.</div>;
  }

  return (
    <>
      <div className={styles.userActionsContainer}>
        <div className={styles.actionsLayout}>
          <button
            className={classNames(styles.actionButton, {
              [styles.followed]: isFollowed,
            })}
            disabled={isFollowLoading}
            onClick={handleFollowUser}
          >
            {isFollowed ? (
              <>
                Follow <LuUserRoundCheck />
              </>
            ) : (
              <>
                Follow <LuUserRoundPlus />
              </>
            )}
          </button>
          <button className={styles.actionButtonAlt} onClick={handleReport}>
            Report <LuCircleAlert />
          </button>
          <button className={styles.actionButtonAlt} onClick={handleMore}>
            More <LuEllipsis />
          </button>

          <StatItem
            icon={LuUsersRound}
            value={stats.followers}
            label="Followers"
          />
          <StatItem
            icon={LuUsersRound}
            value={stats.following}
            label="Following"
          />
          <StatItem value={stats.joinDate} label="Joined" />
        </div>
      </div>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportedId={userId}
        reportedTitle={username}
        reportedType="user"
      />
    </>
  );
};

export default memo(UserActions);
