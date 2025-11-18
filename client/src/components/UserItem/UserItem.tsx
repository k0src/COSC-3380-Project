import { memo } from "react";
import { Link } from "react-router-dom";
import type { User } from "@types";
import { LazyImg } from "@components";
import styles from "./UserItem.module.css";
import userPlaceholder from "@assets/user-placeholder.webp";

export interface UserItemProps {
  user: User;
  size?: number;
}

const UserItem: React.FC<UserItemProps> = ({ user, size = 18 }) => {
  return (
    <Link className={styles.userItem} to={`/users/${user.id}`}>
      <LazyImg
        src={user.profile_picture_url || userPlaceholder}
        blurHash={user.pfp_blurhash}
        alt={user.username}
        imgClassNames={[styles.userImage]}
        size={size}
      />
      <span className={styles.username}>{user.username}</span>
    </Link>
  );
};

export default memo(UserItem);
