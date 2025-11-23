import { memo, useState, useMemo, useCallback, useRef } from "react";
import type {
  Album,
  DataTableAction,
  DataTableBulkAction,
  AccessContext,
} from "@types";
import { DataTable, ConfirmationModal, EditAlbumModal } from "@components";
import { albumApi } from "@api";
import {
  albumColumns,
  albumFilterKeys,
} from "@components/DataTable/columnDefinitions";
import { LuTrash2, LuSquarePen } from "react-icons/lu";

export interface AdminManageContentAlbumsProps {
  accessContext: AccessContext;
}

const AdminManageContentAlbums: React.FC<AdminManageContentAlbumsProps> = ({
  accessContext,
}) => {
  const [isAlbumEditModalOpen, setIsAlbumEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const [albumToEdit, setAlbumToEdit] = useState<Album | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [albumsToBulkDelete, setAlbumsToBulkDelete] = useState<Album[]>([]);

  const refetchRef = useRef<(() => void) | null>(null);

  const fetchAlbums = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return albumApi.getMany(accessContext, {
        includeLikes: true,
        includeSongCount: true,
        includeArtist: true,
        limit,
        offset,
      });
    },
    [accessContext]
  );

  const handleDeleteClick = useCallback((album: Album, refetch: () => void) => {
    setAlbumToDelete(album);
    setIsDeleteModalOpen(true);
    refetchRef.current = refetch;
  }, []);

  const handleEditClick = useCallback((album: Album, refetch: () => void) => {
    setAlbumToEdit(album);
    setIsAlbumEditModalOpen(true);
    refetchRef.current = refetch;
  }, []);

  const handleAlbumEdited = useCallback(() => {
    if (refetchRef.current) {
      refetchRef.current();
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!albumToDelete) return;

    try {
      await albumApi.delete(albumToDelete.id);
      setIsDeleteModalOpen(false);
      setAlbumToDelete(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to delete album:", error);
      throw error;
    }
  }, [albumToDelete]);

  const handleBulkDeleteClick = useCallback(
    (albums: Album[], refetch: () => void) => {
      setAlbumsToBulkDelete(albums);
      setIsBulkDeleteModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleConfirmBulkDelete = useCallback(async () => {
    if (albumsToBulkDelete.length === 0) return;

    try {
      await albumApi.bulkDelete(albumsToBulkDelete.map((c) => c.id));
      setIsBulkDeleteModalOpen(false);
      setAlbumsToBulkDelete([]);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to bulk delete albums:", error);
      throw error;
    }
  }, [albumsToBulkDelete]);

  const actions = useMemo<DataTableAction<Album>[]>(
    () => [
      {
        id: "edit",
        icon: LuSquarePen,
        label: "Edit Album",
        onClick: handleEditClick,
      },
      {
        id: "delete",
        icon: LuTrash2,
        label: "Delete Album",
        onClick: handleDeleteClick,
        variant: "danger",
      },
    ],
    [handleDeleteClick, handleEditClick]
  );

  const bulkActions = useMemo<DataTableBulkAction<Album>[]>(
    () => [
      {
        id: "delete",
        icon: LuTrash2,
        label: "Delete Albums",
        onClick: handleBulkDeleteClick,
        variant: "danger",
      },
    ],
    [handleBulkDeleteClick]
  );

  return (
    <>
      <DataTable
        fetchData={fetchAlbums}
        columns={albumColumns}
        filterKeys={albumFilterKeys}
        actions={actions}
        bulkActions={bulkActions}
        cacheKey="admin-manage-content-albums"
        dependencies={[accessContext]}
        initialRowsPerPage={25}
        rowsPerPageOptions={[10, 25, 50, 100]}
        theme="dark"
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAlbumToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Album"
        message="Are you sure you want to delete this album? This action cannot be undone."
        confirmButtonText="Delete"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => {
          setIsBulkDeleteModalOpen(false);
          setAlbumsToBulkDelete([]);
        }}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Multiple Albums"
        message={`Are you sure you want to delete ${
          albumsToBulkDelete.length
        } album${
          albumsToBulkDelete.length === 1 ? "" : "s"
        }? This action cannot be undone.`}
        confirmButtonText="Delete All"
        isDangerous={true}
      />

      {albumToEdit && (
        <EditAlbumModal
          isOpen={isAlbumEditModalOpen}
          onClose={() => setIsAlbumEditModalOpen(false)}
          album={albumToEdit}
          onAlbumEdited={handleAlbumEdited}
        />
      )}
    </>
  );
};

export default memo(AdminManageContentAlbums);
