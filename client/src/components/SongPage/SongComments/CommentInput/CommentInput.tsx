import { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { searchApi } from "@api";
import { LazyImg } from "@components";
import CommentUserPopup from "../CommentUserPopup/CommentUserPopup.js";
import styles from "./CommentInput.module.css";
import classNames from "classnames";
import userPlaceholder from "@assets/user-placeholder.webp";
import { LuSend } from "react-icons/lu";
import type { User, AccessContext } from "@types";

const MAX_COMMENT_LENGTH = 255;

export interface CommentInputProps {
  onSubmit: (commentText: string) => Promise<void>;
  isSubmitting: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [commentText, setCommentText] = useState("");
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [tagUsers, setTagUsers] = useState<User[]>([]);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [tagStart, setTagStart] = useState<number | null>(null);
  const [popupLeftOffset, setPopupLeftOffset] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "globalList",
  };

  const handleCommentChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCommentText(value);
      setIsOverLimit(value.length > MAX_COMMENT_LENGTH);

      const cursorPosition = e.target.selectionStart || 0;
      const textBeforeCursor = value.slice(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        const hasSpace = textAfterAt.includes(" ");

        if (!hasSpace && textAfterAt.length >= 0) {
          setTagStart(lastAtIndex);
          setSelectedUserIndex(0);

          if (textAfterAt.length > 0) {
            try {
              const users = await searchApi.searchUsers(
                textAfterAt,
                accessContext
              );
              setTagUsers(users.slice(0, 5));
              setShowUserPopup(users.length > 0);

              if (users.length > 0 && measureRef.current) {
                measureRef.current.textContent = textBeforeCursor.slice(
                  0,
                  lastAtIndex
                );
                const offset = measureRef.current.offsetWidth;
                setPopupLeftOffset(offset - 16);
              }
            } catch (error) {
              console.error("Failed to search users:", error);
              setShowUserPopup(false);
            }
          } else {
            setShowUserPopup(false);
          }
        } else {
          setShowUserPopup(false);
          setTagStart(null);
        }
      } else {
        setShowUserPopup(false);
        setTagStart(null);
      }
    },
    [accessContext.userId]
  );

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) return;

    try {
      if (isAuthenticated && user) {
        await onSubmit(commentText);
        setCommentText("");
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding comment failed:", error);
    }
  }, [isAuthenticated, navigate, commentText, user, onSubmit]);

  const handleSelectUser = useCallback(
    (username: string) => {
      if (tagStart !== null) {
        const beforeTag = commentText.slice(0, tagStart);
        const afterCursor = commentText.slice(
          inputRef.current?.selectionStart || commentText.length
        );
        const newText = `${beforeTag}@${username} ${afterCursor}`;
        setCommentText(newText);
        setShowUserPopup(false);
        setTagStart(null);
        setTagUsers([]);

        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            const newPosition = tagStart + username.length + 2;
            inputRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
    },
    [commentText, tagStart]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showUserPopup && tagUsers.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedUserIndex((prev) => (prev + 1) % tagUsers.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedUserIndex(
            (prev) => (prev - 1 + tagUsers.length) % tagUsers.length
          );
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleSelectUser(tagUsers[selectedUserIndex].username);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setShowUserPopup(false);
          setTagStart(null);
        }
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAddComment();
      }
    },
    [
      handleAddComment,
      showUserPopup,
      tagUsers,
      selectedUserIndex,
      handleSelectUser,
    ]
  );

  const userProfilePic = useMemo(
    () => user?.profile_picture_url || userPlaceholder,
    [user]
  );

  const charCount = commentText.length;
  const showCharCounter = charCount > 100;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowUserPopup(false);
        setTagStart(null);
      }
    };

    if (showUserPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserPopup]);

  return (
    <div className={styles.commentsContainerTop}>
      <LazyImg
        src={userProfilePic}
        blurHash={user?.pfp_blurhash}
        alt={user?.username || "User"}
        imgClassNames={[styles.commentUserPfp]}
      />
      <div
        className={`${styles.commentInputContainer} ${
          isOverLimit ? styles.overLimit : ""
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={
            isAuthenticated ? "Add a comment..." : "Log in to comment"
          }
          onKeyDown={handleKeyPress}
          disabled={!isAuthenticated || isSubmitting}
          className={classNames(styles.commentInput, {
            [styles.commentInputCharCounter]: showCharCounter,
          })}
          value={commentText}
          onChange={handleCommentChange}
          aria-label="Comment text"
          maxLength={300}
        />
        <CommentUserPopup
          users={tagUsers}
          isOpen={showUserPopup}
          onSelectUser={handleSelectUser}
          selectedIndex={selectedUserIndex}
          leftOffset={popupLeftOffset}
          ref={popupRef}
        />
        <span ref={measureRef} className={styles.measureSpan} />
        {showCharCounter && (
          <span
            className={`${styles.charCounter} ${
              isOverLimit ? styles.charCounterOverLimit : ""
            }`}
          >
            {charCount}
          </span>
        )}
        <button
          className={styles.commentButton}
          onClick={handleAddComment}
          disabled={!commentText.trim() || isSubmitting || isOverLimit}
          aria-label="Submit Comment"
        >
          <LuSend />
        </button>
      </div>
    </div>
  );
};

export default memo(CommentInput);
