import { memo, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAsyncData } from "@hooks";
import { useAuth } from "@contexts";
import { PuffLoader } from "react-spinners";
import { commentApi } from "@api";
import { CommentItem, HorizontalRule, LazyImg } from "@components";
import styles from "./SongComments.module.css";
import userPlaceholder from "@assets/user-placeholder.png";
import { LuSend } from "react-icons/lu";

export interface SongCommentsProps {
  songId: string;
}

const SongComments: React.FC<SongCommentsProps> = ({ songId }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, loading, error } = useAsyncData(
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
    },
    []
  );

  const handleAddComment = useCallback(() => {
    if (!commentText.trim()) return;

    try {
      if (isAuthenticated) {
        setIsSubmitting(true);
        //! send request with commentText
        console.log("added comment to song: " + songId, commentText);
        setCommentText("");
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding comment failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, navigate, songId, commentText, isSubmitting]);

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
        <div className={styles.commentInputContainer}>
          <input
            type="text"
            placeholder={
              isAuthenticated ? "Add a comment..." : "Log in to comment"
            }
            onKeyDown={handleKeyPress}
            disabled={!isAuthenticated || isSubmitting}
            className={styles.commentInput}
            value={commentText}
            onChange={handleCommentChange}
            aria-label="Comment text"
          />
          <button
            className={styles.commentButton}
            onClick={handleAddComment}
            disabled={!commentText.trim() || isSubmitting}
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
