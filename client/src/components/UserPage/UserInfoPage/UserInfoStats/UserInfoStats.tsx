import { memo } from "react";
import { BarLoader } from "react-spinners";
import { formatNumber, pluralize } from "@util";
import { userApi } from "@api";
import { useAsyncData } from "@hooks";
import type { UUID } from "@types";
import styles from "./UserInfoStats.module.css";

const StatItem = memo(({ value, label }: { value: number; label: string }) => (
  <div className={styles.statItem}>
    {formatNumber(value)} {label}
  </div>
));

const UserInfoStats: React.FC<{ userId: UUID }> = ({ userId }) => {
  const { data, loading, error } = useAsyncData(
    {
      followerCount: () => userApi.getFollowerCount(userId),
      followingCount: () => userApi.getFollowingCount(userId),
      likedCount: () => userApi.getLikedCount(userId, "song"),
    },
    [userId],
    {
      cacheKey: `user_info_stats_${userId}`,
    }
  );

  const followerCount = data?.followerCount ?? 0;
  const followingCount = data?.followingCount ?? 0;
  const likedCount = data?.likedCount ?? 0;

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <BarLoader color="#D53131" />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Failed to load stats.</div>;
  }

  return (
    <div className={styles.userStats}>
      <StatItem
        value={followerCount}
        label={pluralize(followerCount, "Follower")}
      />
      <span className={styles.statsBullet}>&bull;</span>
      <StatItem value={followingCount} label="Following" />
      <span className={styles.statsBullet}>&bull;</span>
      <StatItem value={likedCount} label="Songs Liked" />
    </div>
  );
};

export default memo(UserInfoStats);
