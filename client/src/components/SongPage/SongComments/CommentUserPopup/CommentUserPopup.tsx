import { memo, useEffect, useRef, forwardRef } from "react";
import type { User } from "@types";
import { LazyImg } from "@components";
import styles from "./CommentUserPopup.module.css";
import userPlaceholder from "@assets/user-placeholder.webp";
import classNames from "classnames";

interface CommentUserPopupProps {
  users: User[];
  isOpen: boolean;
  onSelectUser: (username: string) => void;
  selectedIndex: number;
  leftOffset: number;
}

const CommentUserPopup = forwardRef<HTMLDivElement, CommentUserPopupProps>(
  ({ users, isOpen, onSelectUser, selectedIndex, leftOffset }, ref) => {
    const selectedItemRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (selectedItemRef.current) {
        selectedItemRef.current.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }, [selectedIndex]);

    if (!isOpen || users.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={styles.popup}
        style={{ left: `${leftOffset}px` }}
      >
        <div className={styles.popupContent}>
          {users.map((user, index) => (
            <button
              key={user.id}
              ref={index === selectedIndex ? selectedItemRef : null}
              className={classNames(styles.userItem, {
                [styles.userItemSelected]: index === selectedIndex,
              })}
              onClick={() => onSelectUser(user.username)}
              type="button"
            >
              <LazyImg
                src={user.profile_picture_url || userPlaceholder}
                blurHash={user.pfp_blurhash}
                alt={user.username}
                imgClassNames={[styles.userAvatar]}
              />
              <span className={styles.username}>@{user.username}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

CommentUserPopup.displayName = "CommentUserPopup";

export default memo(CommentUserPopup);
