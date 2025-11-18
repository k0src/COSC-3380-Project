import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { CommentItem, HorizontalRule } from "@components";
import styles from "./CommentsList.module.css";
import type { Comment } from "@types";

export interface CommentsListProps {
  comments: Comment[] | undefined;
  loading: boolean;
}

const CommentsList: React.FC<CommentsListProps> = ({ comments, loading }) => {
  if (loading) {
    return (
      <div className={styles.commentLoaderContainer}>
        <PuffLoader color="var(--color-accent)" size={50} />
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className={styles.noComments}>
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <>
      <HorizontalRule />
      <div className={styles.commentsList}>
        {comments.map((comment: Comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </>
  );
};

export default memo(CommentsList);
