import { memo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { statsApi } from "@api";
import { commentApi } from "@api";
import { ConfirmationModal } from "@components";
import type { UUID } from "@types";
import styles from "./ArtistDashboardComments.module.css";
import { LuTrash2, LuArrowUpDown } from "react-icons/lu";

export interface ArtistDashboardCommentsProps {
  artistId: UUID;
  maxItems?: number;
}

interface ArtistComment {
  id: UUID;
  comment_text: string;
  commented_at: string;
  song_id: UUID;
  song_title: string;
  user_id: UUID;
  username: string;
  profile_picture_url?: string;
  likes: number;
}

type SortColumn = "song_title" | "username" | "commented_at" | "likes";
type SortDirection = "ASC" | "DESC";

const ArtistDashboardComments: React.FC<ArtistDashboardCommentsProps> = ({
  artistId,
  maxItems = 10,
}) => {
  const [deletingId, setDeletingId] = useState<UUID | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<UUID | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>("commented_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");

  const { data, loading, error, refetch } = useAsyncData(
    {
      comments: () =>
        statsApi.getArtistComments(
          artistId,
          maxItems,
          sortColumn,
          sortDirection
        ),
    },
    [artistId, maxItems, sortColumn, sortDirection],
    {
      cacheKey: `artist_comments_${artistId}_${maxItems}_${sortColumn}_${sortDirection}`,
      enabled: !!artistId,
    }
  );

  const comments = (data?.comments || []) as ArtistComment[];

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

  if (loading) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Recent Comments</span>
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
          <span className={styles.sectionTitle}>Recent Comments</span>
          <Link to="/artist-dashboard/comments" className={styles.viewMoreLink}>
            View All
          </Link>
        </div>
        <div className={styles.error}>Failed to load comments.</div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Recent Comments</span>
          <Link to="/artist-dashboard/comments" className={styles.viewMoreLink}>
            View All
          </Link>
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
        <span className={styles.sectionTitle}>Recent Comments</span>
        <Link to="/artist-dashboard/comments" className={styles.viewMoreLink}>
          View All
        </Link>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
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
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {comments.map((comment) => (
              <tr key={comment.id} className={styles.tr}>
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
    </div>
  );
};

export default memo(ArtistDashboardComments);
