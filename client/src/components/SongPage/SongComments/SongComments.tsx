import { memo, useCallback, useState } from "react";
import { useAsyncData } from "@hooks";
import { useAuth } from "@contexts";
import { commentApi } from "@api";
import { CommentInput, CommentsList } from "@components";
import styles from "./SongComments.module.css";
import type { AccessContext } from "@types";

export interface SongCommentsProps {
  songId: string;
}

const SongComments: React.FC<SongCommentsProps> = ({ songId }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commentCtx: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "global",
  };

  const { data, loading, error, refetch } = useAsyncData(
    {
      comments: () =>
        commentApi.getCommentsBySongId(songId, commentCtx, { limit: 25 }),
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
        await commentApi.add(user.id, songId, commentText);
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
