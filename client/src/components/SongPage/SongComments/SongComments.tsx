import { memo, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAsyncData } from "@hooks";
import { useAuth } from "@contexts";
import { PuffLoader } from "react-spinners";
import { commentApi } from "@api";
import { CommentItem, HorizontalRule, LazyImg } from "@components";
import styles from "./SongComments.module.css";
import classNames from "classnames";
import userPlaceholder from "@assets/user-placeholder.png";
import { LuSend } from "react-icons/lu";

const MAX_COMMENT_LENGTH = 255;

export interface SongCommentsProps {
  songId: string;
}
//TODO: fuzzy search users popup for tagging
const SongComments: React.FC<SongCommentsProps> = ({ songId }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOverLimit, setIsOverLimit] = useState(false);

  const { data, loading, error, refetch } = useAsyncData(
    {
      comments: () =>
        commentApi.getCommentsBySongId(songId, {
          includeLikes: true,
          currentUserId: isAuthenticated && user ? user.id : undefined,
          limit: 25,
        }),
    },
    [songId],
    { cacheKey: `comments_${songId}`, hasBlobUrl: true }
  );

  const comments = data?.comments;

  const handleCommentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCommentText(e.target.value);
      setIsOverLimit(e.target.value.length > MAX_COMMENT_LENGTH);
    },
    []
  );

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) return;

    try {
      if (isAuthenticated && user) {
        setIsSubmitting(true);
        await commentApi.addComment(user.id, songId, commentText);
        setCommentText("");
        refetch();
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding comment failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, navigate, songId, commentText, user, refetch]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAddComment();
      }
    },
    [handleAddComment]
  );

  const userProfilePic = useMemo(
    () => user?.profile_picture_url || userPlaceholder,
    [user]
  );

  const charCount = commentText.length;
  const showCharCounter = charCount > 100;

  if (error) {
    return <div className={styles.error}>Failed to load comments.</div>;
  }
  return (
    <div className={styles.commentsContainer}>
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
      {loading ? (
        <div className={styles.commentLoaderContainer}>
          <PuffLoader color="#D53131" size={50} />
        </div>
      ) : (
        comments &&
        comments.length > 0 && (
          <>
            <HorizontalRule />
            <div className={styles.commentsList}>
              {comments.map((comment: any) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          </>
        )
      )}
      {!loading && comments && comments.length === 0 && (
        <div className={styles.noComments}>
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
};

export default memo(SongComments);
