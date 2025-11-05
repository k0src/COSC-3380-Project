import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { LuPlus } from "react-icons/lu";
import { artistApi } from "@api";
import { useAsyncData } from "@hooks";
import type { UUID } from "@types";
import styles from "./FollowProfiles.module.css";
import userPlaceholder from "@assets/user-placeholder.png";

export interface FollowProfilesProps {
  title: string;
  userId: UUID;
  following?: boolean;
  profileLimit: number;
}

const FollowProfiles: React.FC<FollowProfilesProps> = ({
  title,
  userId,
  following = true,
  profileLimit,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      profiles: () =>
        (following ? artistApi.getFollowing : artistApi.getFollowers)(userId, {
          limit: profileLimit + 1,
        }),
    },
    [userId, following, profileLimit],
    {
      cacheKey: `${following ? "following" : "followers"}_${userId}`,
      hasBlobUrl: true,
    }
  );

  const profiles = data?.profiles;

  const { displayProfiles, hasMore } = useMemo(() => {
    if (!profiles || profiles.length === 0) {
      return { displayProfiles: [], hasMore: false };
    }
    const display = profiles.slice(0, profileLimit);
    const more = profiles.length > profileLimit;
    return { displayProfiles: display, hasMore: more };
  }, [profiles, profileLimit]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={25} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>Failed to load {title.toLowerCase()}.</div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return null;
  }

  return (
    <div className={styles.followContainer}>
      <span className={styles.sectionTitle}>{title}</span>
      <div className={styles.avatarStack}>
        {displayProfiles.map((profile) => (
          <Link
            key={profile.id}
            to={`/users/${profile.id}`}
            className={styles.avatarLink}
          >
            <img
              src={profile.profile_picture_url || userPlaceholder}
              alt={`${profile.username ?? "User"}'s profile picture`}
              className={styles.avatar}
              loading="lazy"
            />
          </Link>
        ))}
        {hasMore && (
          <Link
            to={`/users/${userId}/${following ? "following" : "followers"}`}
            className={styles.avatarMore}
            aria-label={`View all ${profiles.length} ${title.toLowerCase()}`}
          >
            <LuPlus aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default memo(FollowProfiles);
