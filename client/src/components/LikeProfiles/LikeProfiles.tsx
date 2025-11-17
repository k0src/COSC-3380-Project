import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { LuPlus } from "react-icons/lu";
import { songApi, albumApi, playlistApi } from "@api";
import { LazyImg } from "@components";
import { useAsyncData } from "@hooks";
import type { UUID } from "@types";
import styles from "./LikeProfiles.module.css";
import userPlaceholder from "@assets/user-placeholder.webp";

export interface LikeProfilesProps {
  title: string;
  entityId: UUID;
  entityType: "song" | "album" | "playlist";
  profileLimit: number;
  profileMin?: number;
}

const LikeProfiles: React.FC<LikeProfilesProps> = ({
  title,
  entityId,
  entityType,
  profileLimit,
  profileMin = 0,
}) => {
  const getApiFn = () => {
    switch (entityType) {
      case "song":
        return () => songApi.getLikedBy(entityId, { limit: profileLimit + 1 });
      case "album":
        return () => albumApi.getLikedBy(entityId, { limit: profileLimit + 1 });
      case "playlist":
        return () =>
          playlistApi.getLikedBy(entityId, { limit: profileLimit + 1 });
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }
  };

  const { data, loading, error } = useAsyncData(
    {
      profiles: getApiFn(),
    },
    [entityId, entityType, profileLimit],
    {
      cacheKey: `likes_${entityType}_${entityId}`,
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
        <PuffLoader color="var(--color-accent)" size={25} />
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

  if (profiles.length < profileMin) {
    return null;
  }

  return (
    <div className={styles.likeContainer}>
      <span className={styles.sectionTitle}>{title}</span>
      <div className={styles.avatarStack}>
        {displayProfiles.map((profile) => (
          <Link
            key={profile.id}
            to={`/users/${profile.id}`}
            className={styles.avatarLink}
          >
            <LazyImg
              src={profile.profile_picture_url || userPlaceholder}
              blurHash={profile.pfp_blurhash}
              alt={`${profile.username ?? "User"}'s profile picture`}
              imgClassNames={[styles.avatar]}
            />
          </Link>
        ))}
        {hasMore && (
          <div className={styles.avatarMore}>
            <LuPlus aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(LikeProfiles);
