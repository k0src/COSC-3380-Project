import { memo, useCallback, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@contexts";
import { useLikeStatus } from "@hooks";
import { formatRelativeDate } from "@util";
import type { Comment } from "@types";
import userPlaceholder from "@assets/user-placeholder.png";
import styles from "./CommentItem.module.css";
import classNames from "classnames";
import { LuThumbsUp } from "react-icons/lu";

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  const [likeCount, setLikeCount] = useState(Number(comment.likes) || 0);

  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    isLiked,
    toggleLike,
    isLoading: isLikeLoading,
  } = useLikeStatus({
    userId: user?.id || "",
    entityId: comment.id,
    entityType: "comment",
    isAuthenticated,
  });

  useEffect(() => {
    if (user?.id && comment?.id) {
      queryClient.invalidateQueries({
        queryKey: ["likeStatus", user.id, comment.id, "comment"],
      });
    }
  }, [user?.id, comment?.id]);

  const handleToggleCommentLike = useCallback(async () => {
    try {
      if (!isAuthenticated) return navigate("/login");
      await toggleLike();
      if (isLiked) {
        setLikeCount((prev) => prev - 1);
      } else {
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Toggling comment like failed:", error);
    }
  }, [isAuthenticated, navigate, toggleLike, isLiked]);

  useEffect(() => {
    setLikeCount(Number(comment.likes) || 0);
  }, [comment.id, comment.likes]);

  const { comment_text, tags } = comment;

  const segments = useMemo(() => {
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    if (tags && tags.length > 0) {
      const sortedTags = [...tags].sort((a, b) => a.start - b.start);

      for (const tag of sortedTags) {
        if (tag.start > lastIndex) {
          result.push(comment_text.slice(lastIndex, tag.start));
        }

        result.push(
          <Link
            key={tag.user_id + tag.start}
            to={`/users/${tag.user_id}`}
            className={styles.commentTag}
          >
            {comment_text.slice(tag.start, tag.end)}
          </Link>
        );

        lastIndex = tag.end;
      }
    }

    if (lastIndex < comment_text.length) {
      result.push(
        <span key={`text-${lastIndex}-end`}>
          {comment_text.slice(lastIndex)}
        </span>
      );
    }

    return result;
  }, [comment_text, tags]);

  const profilePicUrl = useMemo(
    () => comment.profile_picture_url || userPlaceholder,
    [comment.profile_picture_url]
  );

  const formattedDate = useMemo(
    () => formatRelativeDate(comment.commented_at),
    [comment.commented_at]
  );

  return (
    <div className={styles.comment}>
      <img
        src={profilePicUrl}
        alt={comment.username}
        className={styles.commentListUserPfp}
        loading="lazy"
      />
      <div className={styles.commentContentWrapper}>
        <div className={styles.commentContent}>
          <div className={styles.commentHeader}>
            <span className={styles.commentUsername}>{comment.username}</span>
            <span className={styles.commentSeparator}>&bull;</span>
            <span className={styles.commentTimestamp}>{formattedDate}</span>
          </div>
          <span className={styles.commentText}>{segments}</span>
        </div>
        <div
          className={classNames(styles.commentLikesContainer, {
            [styles.commentLikesContainerActive]: isLiked,
          })}
        >
          <span className={styles.commentLikeCount}>{likeCount}</span>
          <button
            className={classNames(styles.commentLikeButton, {
              [styles.commentLikeButtonActive]: isLiked,
            })}
            onClick={handleToggleCommentLike}
            aria-label={isLiked ? "Unlike comment" : "Like comment"}
            disabled={isLikeLoading}
          >
            <LuThumbsUp />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(CommentItem);
