import { memo } from "react";
import { Link } from "react-router-dom";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID } from "@types";
import { LazyImg } from "@components";
import { userApi } from "@api";
import { useAsyncData } from "@hooks";
import styles from "./UserInfoFollowers.module.css";
import userPlaceholder from "@assets/user-placeholder.webp";

const UserInfoFollowers: React.FC<{ userId: UUID; username: string }> = ({
  userId,
  username,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      followers: () => userApi.getFollowers(userId),
    },
    [userId],
    {
      cacheKey: `user_followers_${userId}`,
      hasBlobUrl: true,
    }
  );

  const followers = data?.followers || [];

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading followers.</div>;
  }

  return (
    <>
      {followers.length === 0 ? (
        <span
          className={styles.noFollows}
        >{`${username} has no followers.`}</span>
      ) : (
        <div className={styles.followContainer}>
          {followers.map((follower) => (
            <Link
              key={follower.id}
              className={styles.followItem}
              to={`/users/${follower.id}`}
            >
              <LazyImg
                src={follower.profile_picture_url || userPlaceholder}
                blurHash={follower.pfp_blurhash}
                alt={follower.username}
                imgClassNames={[styles.followAvatar]}
              />
              <span className={styles.followName}>{follower.username}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default memo(UserInfoFollowers);
