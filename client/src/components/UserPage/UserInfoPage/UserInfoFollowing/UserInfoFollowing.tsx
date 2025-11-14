import { memo } from "react";
import { Link } from "react-router-dom";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID } from "@types";
import { LazyImg } from "@components";
import { userApi } from "@api";
import { useAsyncData } from "@hooks";
import styles from "./UserInfoFollowing.module.css";
import userPlaceholder from "@assets/user-placeholder.webp";

const UserInfoFollowing: React.FC<{ userId: UUID; username: string }> = ({
  userId,
  username,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      following: () => userApi.getFollowing(userId),
    },
    [userId],
    {
      cacheKey: `user_following_${userId}`,
      hasBlobUrl: true,
    }
  );

  const following = data?.following || [];

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading following.</div>;
  }

  return (
    <>
      {following.length === 0 ? (
        <span
          className={styles.noFollows}
        >{`${username} is not following any users.`}</span>
      ) : (
        <div className={styles.followContainer}>
          {following.map((follower) => (
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
              <Link className={styles.followName} to={`/users/${follower.id}`}>
                {follower.username}
              </Link>
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default memo(UserInfoFollowing);
