import { memo, useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { commentApi } from "@api";
import { ConfirmationModal } from "@components";
import type { UUID, Comment } from "@types";
import styles from "./CommentTable.module.css";
import { LuTrash2, LuArrowUpDown } from "react-icons/lu";

export interface CommentTableProps {
  fetchData: () => Promise<Comment[]>;
  cacheKey: string;
  dependencies?: any[];
  onRefetchNeeded?: React.RefObject<(() => void) | null>;
  title: string;
  viewAllLink?: boolean;
  hasBulkEdit?: boolean;
}

type SortColumn = "song_title" | "username" | "commented_at" | "likes";
type SortDirection = "ASC" | "DESC";

const CommentTable: React.FC<CommentTableProps> = ({
  fetchData,
  cacheKey,
  dependencies = [],
  onRefetchNeeded,
  title,
  viewAllLink = true,
  hasBulkEdit = false,
}) => {
  const [deletingId, setDeletingId] = useState<UUID | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<UUID | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>("commented_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");
  const [selectedComments, setSelectedComments] = useState<Set<UUID>>(
    new Set()
  );
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkConfirmModalOpen, setIsBulkConfirmModalOpen] = useState(false);

  const { data, loading, error, refetch } = useAsyncData(
    {
      comments: fetchData,
    },
    dependencies,
    {
      cacheKey,
      hasBlobUrl: true,
    }
  );

  useEffect(() => {
    if (onRefetchNeeded) {
      onRefetchNeeded.current = refetch;
    }
  }, [refetch, onRefetchNeeded]);

  const rawComments: Comment[] = data?.comments || [];

  const comments = useMemo(() => {
    const sorted = [...rawComments];

    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "song_title":
          aValue = a.song_title?.toLowerCase() || "";
          bValue = b.song_title?.toLowerCase() || "";
          break;
        case "username":
          aValue = a.username?.toLowerCase() || "";
          bValue = b.username?.toLowerCase() || "";
          break;
        case "commented_at":
          aValue = new Date(a.commented_at || 0).getTime();
          bValue = new Date(b.commented_at || 0).getTime();
          break;
        case "likes":
          aValue = a.likes || 0;
          bValue = b.likes || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "ASC" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "ASC" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [rawComments, sortColumn, sortDirection]);

  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortColumn === column) {
        setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
      } else {
        setSortColumn(column);
        setSortDirection("DESC");
      }
    },
    [sortColumn]
  );

  const handleDeleteClick = useCallback((commentId: UUID) => {
    setCommentToDelete(commentId);
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!commentToDelete) return;

    setDeletingId(commentToDelete);
    try {
      await commentApi.deleteComment(commentToDelete);
      setSelectedComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentToDelete);
        return newSet;
      });
      refetch();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      throw error;
    } finally {
      setDeletingId(null);
      setCommentToDelete(null);
    }
  }, [commentToDelete, refetch]);

  const handleCloseModal = useCallback(() => {
    setIsConfirmModalOpen(false);
    setCommentToDelete(null);
  }, []);

  const handleSelectComment = useCallback((commentId: UUID) => {
    setSelectedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedComments.size === comments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(comments.map((c) => c.id)));
    }
  }, [comments, selectedComments.size]);

  const handleBulkDeleteClick = useCallback(() => {
    setIsBulkConfirmModalOpen(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (selectedComments.size === 0) return;

    setIsBulkDeleting(true);
    try {
      await commentApi.bulkDeleteComments(Array.from(selectedComments));
      setSelectedComments(new Set());
      refetch();
    } catch (error) {
      console.error("Failed to bulk delete comments:", error);
      throw error;
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedComments, refetch]);

  const handleCloseBulkModal = useCallback(() => {
    setIsBulkConfirmModalOpen(false);
  }, []);

  if (loading) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{title}</span>
          <Link to="/artist-dashboard/comments" className={styles.viewMoreLink}>
            View All
          </Link>
        </div>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{title}</span>
          {viewAllLink && (
            <Link
              to="/artist-dashboard/comments"
              className={styles.viewMoreLink}
            >
              View All
            </Link>
          )}
        </div>
        <div className={styles.error}>Failed to load comments.</div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{title}</span>
          {viewAllLink && (
            <Link
              to="/artist-dashboard/comments"
              className={styles.viewMoreLink}
            >
              View All
            </Link>
          )}
        </div>
        <div className={styles.noDataContainer}>
          <span className={styles.noDataMessage}>
            No comments on your songs yet.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{title}</span>
        <div className={styles.headerActions}>
          {hasBulkEdit && (
            <div className={styles.bulkDeleteButtonContainer}>
              {selectedComments.size > 0 && (
                <button
                  className={styles.bulkDeleteButton}
                  onClick={handleBulkDeleteClick}
                  disabled={isBulkDeleting}
                >
                  <LuTrash2 />
                  Delete Selected ({selectedComments.size})
                </button>
              )}
            </div>
          )}

          <Link to="/artist-dashboard/comments" className={styles.viewMoreLink}>
            View All
          </Link>
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {hasBulkEdit && (
                <th className={styles.thCheckbox}>
                  <div className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      className={styles.customCheckbox}
                      checked={
                        comments.length > 0 &&
                        selectedComments.size === comments.length
                      }
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
              )}
              <th className={styles.th}>
                <button
                  className={styles.sortButton}
                  onClick={() => handleSort("song_title")}
                >
                  <span>Song</span>
                  <LuArrowUpDown
                    className={
                      sortColumn === "song_title" ? styles.sortActive : ""
                    }
                  />
                </button>
              </th>
              <th className={styles.th}>
                <button
                  className={styles.sortButton}
                  onClick={() => handleSort("username")}
                >
                  <span>User</span>
                  <LuArrowUpDown
                    className={
                      sortColumn === "username" ? styles.sortActive : ""
                    }
                  />
                </button>
              </th>
              <th className={styles.th}>Comment</th>
              <th className={styles.th}>
                <button
                  className={styles.sortButton}
                  onClick={() => handleSort("likes")}
                >
                  <span>Likes</span>
                  <LuArrowUpDown
                    className={sortColumn === "likes" ? styles.sortActive : ""}
                  />
                </button>
              </th>
              <th className={styles.th}>Remove</th>
            </tr>
          </thead>

          <tbody className={styles.tbody}>
            {comments.map((comment) => (
              <tr key={comment.id} className={styles.tr}>
                {hasBulkEdit && (
                  <td className={styles.tdCheckbox}>
                    <div className={styles.checkboxWrapper}>
                      <input
                        type="checkbox"
                        className={styles.customCheckbox}
                        checked={selectedComments.has(comment.id)}
                        onChange={() => handleSelectComment(comment.id)}
                        aria-label={`Select comment by ${comment.username}`}
                      />
                    </div>
                  </td>
                )}
                <td className={styles.td}>
                  <Link
                    to={`/songs/${comment.song_id}`}
                    className={styles.songLink}
                  >
                    {comment.song_title}
                  </Link>
                </td>
                <td className={styles.td}>
                  <Link
                    to={`/users/${comment.user_id}`}
                    className={styles.userLink}
                  >
                    {comment.username}
                  </Link>
                </td>
                <td className={styles.td}>
                  <span className={styles.commentText}>
                    {comment.comment_text}
                  </span>
                </td>
                <td className={styles.td}>
                  <span className={styles.likesCount}>{comment.likes}</span>
                </td>
                <td className={styles.td}>
                  <button
                    onClick={() => handleDeleteClick(comment.id)}
                    disabled={deletingId === comment.id}
                    className={styles.deleteButton}
                    aria-label="Delete comment"
                  >
                    <LuTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmButtonText="Delete"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isBulkConfirmModalOpen}
        onClose={handleCloseBulkModal}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Multiple Comments"
        message={`Are you sure you want to delete ${
          selectedComments.size
        } comment${
          selectedComments.size === 1 ? "" : "s"
        }? This action cannot be undone.`}
        confirmButtonText="Delete All"
        isDangerous={true}
      />
    </div>
  );
};

export default memo(CommentTable);
