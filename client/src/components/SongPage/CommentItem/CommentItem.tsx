import { memo, useCallback, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@contexts";
import { formatRelativeDate } from "@util";
import type { Comment } from "@types";
import userPlaceholder from "@assets/user-placeholder.png";
import styles from "./CommentItem.module.css";
import classNames from "classnames";
import { LuThumbsUp } from "react-icons/lu";

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  const [isLiked, setIsLiked] = useState(comment.user_liked ?? false);
  const [likeCount, setLikeCount] = useState(Number(comment.likes) || 0);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  //! send request here too
  const toggleCommentLike = useCallback(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isLiked) {
      setLikeCount((prev) => prev - 1);
      setIsLiked(false);
    } else {
      setLikeCount((prev) => prev + 1);
      setIsLiked(true);
    }
  }, [isAuthenticated, navigate, isLiked]);

  useEffect(() => {
    setIsLiked(comment.user_liked ?? false);
    setLikeCount(Number(comment.likes) || 0);
  }, [comment.id, comment.user_liked, comment.likes]);

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
            onClick={toggleCommentLike}
            aria-label={isLiked ? "Unlike comment" : "Like comment"}
          >
            <LuThumbsUp />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(CommentItem);
