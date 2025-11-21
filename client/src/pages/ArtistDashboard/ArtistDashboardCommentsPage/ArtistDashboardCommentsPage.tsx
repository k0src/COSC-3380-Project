import { memo, useCallback, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@contexts";
import { commentApi } from "@api";
import { ConfirmationModal, DataTable } from "@components";
import {
  commentColumns,
  commentFilterKeys,
} from "@components/DataTable/columnDefinitions";
import type { Comment, DataTableAction, DataTableBulkAction } from "@types";
import styles from "./ArtistDashboardCommentsPage.module.css";
import { LuTrash2 } from "react-icons/lu";

const ArtistDashboardCommentsPage: React.FC = () => {
  const { user } = useAuth();
  const artistId = user?.artist_id;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [commentsToBulkDelete, setCommentsToBulkDelete] = useState<Comment[]>(
    []
  );
  const refetchRef = useRef<(() => void) | null>(null);

  const fetchArtistComments = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return commentApi.getCommentsByArtistId(artistId!, { limit, offset });
    },
    [artistId]
  );

  const handleDeleteClick = useCallback(
    (comment: Comment, refetch: () => void) => {
      setCommentToDelete(comment);
      setIsDeleteModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!commentToDelete) return;

    try {
      await commentApi.deleteComment(commentToDelete.id);
      setIsDeleteModalOpen(false);
      setCommentToDelete(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      throw error;
    }
  }, [commentToDelete]);

  const handleBulkDeleteClick = useCallback(
    (comments: Comment[], refetch: () => void) => {
      setCommentsToBulkDelete(comments);
      setIsBulkDeleteModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleConfirmBulkDelete = useCallback(async () => {
    if (commentsToBulkDelete.length === 0) return;

    try {
      await commentApi.bulkDeleteComments(
        commentsToBulkDelete.map((c) => c.id)
      );
      setIsBulkDeleteModalOpen(false);
      setCommentsToBulkDelete([]);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to bulk delete comments:", error);
      throw error;
    }
  }, [commentsToBulkDelete]);

  const commentActions: DataTableAction<Comment>[] = [
    {
      id: "delete",
      icon: LuTrash2,
      label: "Delete",
      onClick: handleDeleteClick,
      variant: "danger",
    },
  ];

  const commentBulkActions: DataTableBulkAction<Comment>[] = [
    {
      id: "delete",
      icon: LuTrash2,
      label: "Delete",
      onClick: handleBulkDeleteClick,
      variant: "danger",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Comments - Artist Dashboard</title>
      </Helmet>

      <div className={styles.commentsLayout}>
        <header className={styles.commentsHeader}>
          <span className={styles.commentsTitle}>Comments</span>
          <span className={styles.commentsSubtitle}>
            Manage comments on your uploaded tracks.
          </span>
        </header>

        <DataTable
          fetchData={fetchArtistComments}
          columns={commentColumns}
          filterKeys={commentFilterKeys}
          actions={commentActions}
          bulkActions={commentBulkActions}
          cacheKey={`artist_${artistId}_all_comments`}
          dependencies={[artistId]}
          initialRowsPerPage={50}
          rowsPerPageOptions={[25, 50, 100, 200]}
        />

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setCommentToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          confirmButtonText="Delete"
          isDangerous={true}
        />

        <ConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => {
            setIsBulkDeleteModalOpen(false);
            setCommentsToBulkDelete([]);
          }}
          onConfirm={handleConfirmBulkDelete}
          title="Delete Multiple Comments"
          message={`Are you sure you want to delete ${
            commentsToBulkDelete.length
          } comment${
            commentsToBulkDelete.length === 1 ? "" : "s"
          }? This action cannot be undone.`}
          confirmButtonText="Delete All"
          isDangerous={true}
        />
      </div>
    </>
  );
};

export default memo(ArtistDashboardCommentsPage);
