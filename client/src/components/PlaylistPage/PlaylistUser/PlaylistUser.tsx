import { memo, useMemo, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import type { User } from "@types";
import { LuUserRoundCheck, LuUserRoundPlus } from "react-icons/lu";
import styles from "./PlaylistUser.module.css";
import classNames from "classnames";
import userPlaceholder from "@assets/user-placeholder.png";

export interface PlaylistUserProps {
  user: User;
}

const PlaylistUser: React.FC<PlaylistUserProps> = ({ user }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  const profilePicUrl = useMemo(
    () => user.profile_picture_url || userPlaceholder,
    [user.profile_picture_url]
  );

  const handleFollow = useCallback(() => {
    //! follow user...
    setIsFollowing((prev) => !prev);
  }, []);

  return (
    <div className={styles.userContainer}>
      <img
        src={profilePicUrl}
        alt={`${user.username} Image`}
        className={styles.userProfilePicture}
        onClick={handleFollow}
        loading="lazy"
      />
      <div className={styles.usernameContainer}>
        <Link className={styles.usernameText} to={`/users/${user.id}`}>
          {user.username}
        </Link>
        <button
          className={classNames(styles.followButton, {
            [styles.followButtonActive]: isFollowing,
          })}
          onClick={handleFollow}
        >
          {isFollowing ? <LuUserRoundCheck /> : <LuUserRoundPlus />}
        </button>
      </div>
    </div>
  );
};

export default memo(PlaylistUser);
