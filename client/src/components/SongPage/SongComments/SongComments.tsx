import { memo, useCallback, useState } from "react";
import { useAsyncData } from "@hooks";
import { useAuth } from "@contexts";
import { commentApi } from "@api";
import { CommentInput, CommentsList } from "@components";
import styles from "./SongComments.module.css";

export interface SongCommentsProps {
  songId: string;
}

const SongComments: React.FC<SongCommentsProps> = ({ songId }) => {
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, loading, error, refetch } = useAsyncData(
    {
      comments: () =>
        commentApi.getCommentsBySongId(songId, {
          currentUserId: isAuthenticated && user ? user.id : undefined,
          limit: 25,
        }),
    },
    [songId],
    { cacheKey: `comments_${songId}`, hasBlobUrl: true }
  );

  const comments = data?.comments;

  const handleSubmitComment = useCallback(
    async (commentText: string) => {
      if (!user) return;
      setIsSubmitting(true);
      try {
        await commentApi.addComment(user.id, songId, commentText);
        refetch();
      } catch (error) {
        console.error("Adding comment failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, songId, refetch]
  );

  if (error) {
    return <div className={styles.error}>Failed to load comments.</div>;
  }

  return (
    <div className={styles.commentsContainer}>
      <CommentInput
        onSubmit={handleSubmitComment}
        isSubmitting={isSubmitting}
      />
      <CommentsList comments={comments} loading={loading} />
    </div>
  );
};

export default memo(SongComments);
