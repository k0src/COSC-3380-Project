import { memo, useState, useMemo, useCallback, useRef } from "react";
import type {
  Playlist,
  DataTableAction,
  DataTableBulkAction,
  AccessContext,
} from "@types";
import { DataTable, ConfirmationModal, EditPlaylistModal } from "@components";
import { playlistApi, adminApi } from "@api";
import {
  playlistColumns,
  playlistFilterKeys,
} from "@components/DataTable/columnDefinitions";
import { LuTrash2, LuSquarePen, LuStar } from "react-icons/lu";

export interface AdminManageContentPlaylistsProps {
  accessContext: AccessContext;
}

const AdminManageContentPlaylists: React.FC<
  AdminManageContentPlaylistsProps
> = ({ accessContext }) => {
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(
    null
  );
  const [playlistsToBulkDelete, setPlaylistsToBulkDelete] = useState<
    Playlist[]
  >([]);

  const [isPlaylistEditModalOpen, setIsPlaylistEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isFeaturedConfirmModalOpen, setIsFeaturedConfirmModalOpen] =
    useState(false);
  const [playlistToFeature, setPlaylistToFeature] = useState<Playlist | null>(
    null
  );

  const refetchRef = useRef<(() => void) | null>(null);

  const fetchPlaylists = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return playlistApi.getManyPlaylists(accessContext, {
        limit,
        offset,
      });
    },
    [accessContext]
  );

  const handleDeleteClick = useCallback(
    (playlist: Playlist, refetch: () => void) => {
      setPlaylistToDelete(playlist);
      setIsDeleteModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleEditClick = useCallback(
    (playlist: Playlist, refetch: () => void) => {
      setPlaylistToEdit(playlist);
      setIsPlaylistEditModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleFeatureClick = useCallback(
    (playlist: Playlist, refetch: () => void) => {
      setPlaylistToFeature(playlist);
      setIsFeaturedConfirmModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleConfirmFeature = useCallback(async () => {
    if (!playlistToFeature) return;

    try {
      await adminApi.setFeaturedPlaylist(playlistToFeature.id);
      setIsFeaturedConfirmModalOpen(false);
      setPlaylistToFeature(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to set featured playlist:", error);
      throw error;
    }
  }, [playlistToFeature]);

  const handlePlaylistEdited = useCallback(() => {
    if (refetchRef.current) {
      refetchRef.current();
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!playlistToDelete) return;

    try {
      await playlistApi.delete(playlistToDelete.id);
      setIsDeleteModalOpen(false);
      setPlaylistToDelete(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      throw error;
    }
  }, [playlistToDelete]);

  const handleBulkDeleteClick = useCallback(
    (playlists: Playlist[], refetch: () => void) => {
      setPlaylistsToBulkDelete(playlists);
      setIsBulkDeleteModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleConfirmBulkDelete = useCallback(async () => {
    if (playlistsToBulkDelete.length === 0) return;

    try {
      await playlistApi.bulkDelete(playlistsToBulkDelete.map((c) => c.id));
      setIsBulkDeleteModalOpen(false);
      setPlaylistsToBulkDelete([]);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to bulk delete playlists:", error);
      throw error;
    }
  }, [playlistsToBulkDelete]);

  const actions = useMemo<DataTableAction<Playlist>[]>(
    () => [
      {
        id: "edit",
        icon: LuSquarePen,
        label: "Edit Playlist",
        onClick: handleEditClick,
      },
      {
        id: "feature",
        icon: LuStar,
        label: "Set as Featured",
        onClick: handleFeatureClick,
      },
      {
        id: "delete",
        icon: LuTrash2,
        label: "Delete Playlist",
        onClick: handleDeleteClick,
        variant: "danger",
      },
    ],
    [handleDeleteClick, handleEditClick, handleFeatureClick]
  );

  const bulkActions = useMemo<DataTableBulkAction<Playlist>[]>(
    () => [
      {
        id: "delete",
        icon: LuTrash2,
        label: "Delete Playlists",
        onClick: handleBulkDeleteClick,
        variant: "danger",
      },
    ],
    [handleBulkDeleteClick]
  );

  return (
    <>
      <DataTable
        fetchData={fetchPlaylists}
        columns={playlistColumns}
        filterKeys={playlistFilterKeys}
        actions={actions}
        bulkActions={bulkActions}
        cacheKey="admin-manage-content-playlists"
        dependencies={[accessContext]}
        initialRowsPerPage={25}
        rowsPerPageOptions={[10, 25, 50, 100]}
        theme="dark"
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPlaylistToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Playlist"
        message="Are you sure you want to delete this playlist? This action cannot be undone."
        confirmButtonText="Delete"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => {
          setIsBulkDeleteModalOpen(false);
          setPlaylistsToBulkDelete([]);
        }}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Multiple Playlists"
        message={`Are you sure you want to delete ${
          playlistsToBulkDelete.length
        } playlist${
          playlistsToBulkDelete.length === 1 ? "" : "s"
        }? This action cannot be undone.`}
        confirmButtonText="Delete All"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isFeaturedConfirmModalOpen}
        onClose={() => {
          setIsFeaturedConfirmModalOpen(false);
          setPlaylistToFeature(null);
        }}
        onConfirm={handleConfirmFeature}
        title="Set Featured Playlist"
        message="Setting this playlist as featured will unfeature the currently featured playlist (if one exists). Do you want to continue?"
        confirmButtonText="Set as Featured"
        isDangerous={false}
      />

      {playlistToEdit && (
        <EditPlaylistModal
          isOpen={isPlaylistEditModalOpen}
          onClose={() => setIsPlaylistEditModalOpen(false)}
          playlist={playlistToEdit}
          onPlaylistUpdated={handlePlaylistEdited}
          adminMode
        />
      )}
    </>
  );
};

export default memo(AdminManageContentPlaylists);
