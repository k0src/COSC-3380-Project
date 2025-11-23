import { memo, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type {
  Song,
  DataTableAction,
  DataTableBulkAction,
  AccessContext,
} from "@types";
import { DataTable, ConfirmationModal, EditSongModal } from "@components";
import { songApi } from "@api";
import {
  songColumns,
  songFilterKeys,
} from "@components/DataTable/columnDefinitions";
import { LuTrash2, LuSquarePen, LuMessageSquare } from "react-icons/lu";

export interface AdminManageContentSongsProps {
  accessContext: AccessContext;
}

const AdminManageContentSongs: React.FC<AdminManageContentSongsProps> = ({
  accessContext,
}) => {
  const navigate = useNavigate();
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [songsToBulkDelete, setSongsToBulkDelete] = useState<Song[]>([]);

  const [isSongEditModalOpen, setIsSongEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const refetchRef = useRef<(() => void) | null>(null);

  const fetchSongs = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return songApi.getMany(accessContext, {
        includeLikes: true,
        includeAlbums: true,
        includeArtists: true,
        limit,
        offset,
      });
    },
    [accessContext]
  );

  const handleDeleteClick = useCallback((song: Song, refetch: () => void) => {
    setSongToDelete(song);
    setIsDeleteModalOpen(true);
    refetchRef.current = refetch;
  }, []);

  const handleEditClick = useCallback((song: Song, refetch: () => void) => {
    setSongToEdit(song);
    setIsSongEditModalOpen(true);
    refetchRef.current = refetch;
  }, []);

  const handleManageCommentsClick = useCallback(
    (song: Song) => {
      navigate(`/admin/manage-content/comments/${song.id}`);
    },
    [navigate]
  );

  const handleSongEdited = useCallback(() => {
    if (refetchRef.current) {
      refetchRef.current();
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!songToDelete) return;

    try {
      await songApi.delete(songToDelete.id);
      setIsDeleteModalOpen(false);
      setSongToDelete(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to delete song:", error);
      throw error;
    }
  }, [songToDelete]);

  const handleBulkDeleteClick = useCallback(
    (songs: Song[], refetch: () => void) => {
      setSongsToBulkDelete(songs);
      setIsBulkDeleteModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleConfirmBulkDelete = useCallback(async () => {
    if (songsToBulkDelete.length === 0) return;

    try {
      await songApi.bulkDelete(songsToBulkDelete.map((c) => c.id));
      setIsBulkDeleteModalOpen(false);
      setSongsToBulkDelete([]);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to bulk delete songs:", error);
      throw error;
    }
  }, [songsToBulkDelete]);

  const actions = useMemo<DataTableAction<Song>[]>(
    () => [
      {
        id: "edit",
        icon: LuSquarePen,
        label: "Edit Song",
        onClick: handleEditClick,
      },
      {
        id: "comments",
        icon: LuMessageSquare,
        label: "Manage Comments",
        onClick: handleManageCommentsClick,
      },
      {
        id: "delete",
        icon: LuTrash2,
        label: "Delete Song",
        onClick: handleDeleteClick,
        variant: "danger",
      },
    ],
    [handleDeleteClick, handleEditClick, handleManageCommentsClick]
  );

  const bulkActions = useMemo<DataTableBulkAction<Song>[]>(
    () => [
      {
        id: "delete",
        icon: LuTrash2,
        label: "Delete Songs",
        onClick: handleBulkDeleteClick,
        variant: "danger",
      },
    ],
    [handleBulkDeleteClick]
  );

  return (
    <>
      <DataTable
        fetchData={fetchSongs}
        columns={songColumns}
        filterKeys={songFilterKeys}
        actions={actions}
        bulkActions={bulkActions}
        cacheKey="admin-manage-content-songs"
        dependencies={[accessContext]}
        initialRowsPerPage={25}
        rowsPerPageOptions={[10, 25, 50, 100]}
        theme="dark"
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSongToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Song"
        message="Are you sure you want to delete this song? This action cannot be undone."
        confirmButtonText="Delete"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => {
          setIsBulkDeleteModalOpen(false);
          setSongsToBulkDelete([]);
        }}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Multiple Songs"
        message={`Are you sure you want to delete ${
          songsToBulkDelete.length
        } song${
          songsToBulkDelete.length === 1 ? "" : "s"
        }? This action cannot be undone.`}
        confirmButtonText="Delete All"
        isDangerous={true}
      />

      {songToEdit && (
        <EditSongModal
          isOpen={isSongEditModalOpen}
          onClose={() => setIsSongEditModalOpen(false)}
          song={songToEdit}
          userId={songToEdit.owner_id}
          onSongEdited={handleSongEdited}
          adminMode
        />
      )}
    </>
  );
};

export default memo(AdminManageContentSongs);
