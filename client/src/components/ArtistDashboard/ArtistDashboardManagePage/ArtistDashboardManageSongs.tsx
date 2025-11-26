import { memo, useState, useMemo, useCallback, useRef } from "react";
import type {
  Song,
  DataTableAction,
  DataTableBulkAction,
  AccessContext,
  UUID,
} from "@types";
import { DataTable, ConfirmationModal, EditSongModal } from "@components";
import { artistApi, songApi } from "@api";
import {
  songColumns,
  songFilterKeys,
} from "@components/DataTable/columnDefinitions";
import { LuTrash2, LuSquarePen } from "react-icons/lu";

export interface ArtistDashboardManageSongsProps {
  artistId: UUID;
  userId: UUID;
  accessContext: AccessContext;
}

const ArtistDashboardManageSongs: React.FC<ArtistDashboardManageSongsProps> = ({
  artistId,
  userId,
  accessContext,
}) => {
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [songsToBulkDelete, setSongsToBulkDelete] = useState<Song[]>([]);

  const [isSongEditModalOpen, setIsSongEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const refetchRef = useRef<(() => void) | null>(null);

  const fetchArtistSongs = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return artistApi.getSongs(artistId, accessContext, { limit, offset });
    },
    [artistId, accessContext]
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
        id: "delete",
        icon: LuTrash2,
        label: "Delete Song",
        onClick: handleDeleteClick,
        variant: "danger",
      },
    ],
    [handleDeleteClick, handleEditClick]
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
        fetchData={fetchArtistSongs}
        columns={songColumns}
        filterKeys={songFilterKeys}
        actions={actions}
        bulkActions={bulkActions}
        cacheKey={`artist-${artistId}-songs`}
        dependencies={[artistId, accessContext]}
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
          userId={userId}
          onSongEdited={handleSongEdited}
        />
      )}
    </>
  );
};

export default memo(ArtistDashboardManageSongs);
