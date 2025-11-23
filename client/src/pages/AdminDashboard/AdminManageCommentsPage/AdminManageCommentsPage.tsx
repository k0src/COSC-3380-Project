import { memo, useCallback, useState, useRef, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { commentApi, songApi } from "@api";
import { DataTable } from "@components";
import {
  commentColumns,
  commentFilterKeys,
} from "@components/DataTable/columnDefinitions";
import type {
  Comment,
  DataTableAction,
  DataTableBulkAction,
  Song,
} from "@types";
import styles from "./AdminManageCommentsPage.module.css";
import { LuTrash2, LuArrowLeft } from "react-icons/lu";
import { useAuth } from "@contexts";

const AdminManageCommentsPage: React.FC = () => {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [song, setSong] = useState<Song | null>(null);
  const refetchRef = useRef<(() => void) | null>(null);

  const fetchSongComments = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return commentApi.getCommentsBySongId(songId!, { limit, offset });
    },
    [songId]
  );

  const handleDeleteClick = useCallback(
    async (comment: Comment, refetch: () => void) => {
      try {
        await commentApi.delete(comment.id);
        refetch();
      } catch (error) {
        console.error("Failed to delete comment:", error);
        throw error;
      }
    },
    []
  );

  const handleBulkDeleteClick = useCallback(
    async (comments: Comment[], refetch: () => void) => {
      try {
        await commentApi.bulkDelete(comments.map((c) => c.id));
        refetch();
      } catch (error) {
        console.error("Failed to bulk delete comments:", error);
        throw error;
      }
    },
    []
  );

  const commentActions = useMemo<DataTableAction<Comment>[]>(
    () => [
      {
        id: "delete",
        icon: LuTrash2,
        label: "Delete",
        onClick: handleDeleteClick,
        variant: "danger",
      },
    ],
    [handleDeleteClick]
  );

  const commentBulkActions = useMemo<DataTableBulkAction<Comment>[]>(
    () => [
      {
        id: "delete",
        icon: LuTrash2,
        label: "Delete",
        onClick: handleBulkDeleteClick,
        variant: "danger",
      },
    ],
    [handleBulkDeleteClick]
  );

  // Fetch song details
  const fetchSongDetails = useCallback(async () => {
    if (!songId) return;
    try {
      const songData = await songApi.getSongById(
        songId,
        {
          role: user?.role === "ADMIN" ? "admin" : "user",
          userId: user?.id,
          scope: "ownerList",
        },
        {
          includeArtists: true,
        }
      );
      setSong(songData);
    } catch (error) {
      console.error("Failed to fetch song details:", error);
    }
  }, [songId, user]);

  // Fetch song on mount
  useMemo(() => {
    fetchSongDetails();
  }, [fetchSongDetails]);

  if (!songId) {
    navigate("/admin/manage-content/songs");
    return null;
  }

  return (
    <>
      <Helmet>
        <title>
          Manage Comments - {song?.title || "Song"} - Admin - CoogMusic
        </title>
      </Helmet>

      <div className={styles.commentsLayout}>
        <header className={styles.commentsHeader}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/admin/manage-content/songs")}
          >
            <LuArrowLeft />
            <span>Back to Songs</span>
          </button>
          <span className={styles.commentsTitle}>Manage Comments</span>
          <span className={styles.commentsSubtitle}>
            {song?.title || "Loading..."}
          </span>
        </header>

        <DataTable
          fetchData={fetchSongComments}
          columns={commentColumns}
          filterKeys={commentFilterKeys}
          actions={commentActions}
          bulkActions={commentBulkActions}
          cacheKey={`admin_song_${songId}_comments`}
          dependencies={[songId]}
          initialRowsPerPage={50}
          rowsPerPageOptions={[25, 50, 100, 200]}
        />
      </div>
    </>
  );
};

export default memo(AdminManageCommentsPage);
