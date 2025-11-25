import { memo, useState, useMemo, useCallback, useRef } from "react";
import type {
  Artist,
  DataTableAction,
  DataTableBulkAction,
  AccessContext,
} from "@types";
import { DataTable, ConfirmationModal, EditArtistModal } from "@components";
import { artistApi, adminApi } from "@api";
import {
  artistColumns,
  artistFilterKeys,
} from "@components/DataTable/columnDefinitions";
import { LuTrash2, LuSquarePen, LuBadgeCheck } from "react-icons/lu";

export interface AdminManageContentArtistsProps {
  accessContext: AccessContext;
}

const AdminManageContentArtists: React.FC<AdminManageContentArtistsProps> = ({
  accessContext,
}) => {
  const [artistToEdit, setArtistToEdit] = useState<Artist | null>(null);
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);
  const [artistsToBulkDelete, setArtistsToBulkDelete] = useState<Artist[]>([]);

  const [isArtistEditModalOpen, setIsArtistEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const refetchRef = useRef<(() => void) | null>(null);

  const fetchArtists = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return artistApi.getMany(accessContext, {
        includeUser: true,
        limit,
        offset,
      });
    },
    [accessContext]
  );

  const handleDeleteClick = useCallback(
    (artist: Artist, refetch: () => void) => {
      setArtistToDelete(artist);
      setIsDeleteModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleEditClick = useCallback((artist: Artist, refetch: () => void) => {
    setArtistToEdit(artist);
    setIsArtistEditModalOpen(true);
    refetchRef.current = refetch;
  }, []);

  const handleArtistEdited = useCallback(() => {
    if (refetchRef.current) {
      refetchRef.current();
    }
  }, []);

  const handleVerifyClick = useCallback(
    async (artist: Artist, refetch: () => void) => {
      try {
        if (artist.verified) {
          await adminApi.unverifyArtist(artist.id);
        } else {
          await adminApi.verifyArtist(artist.id);
        }
        refetch();
      } catch (error) {
        console.error("Failed to toggle artist verification:", error);
        throw error;
      }
    },
    []
  );

  const handleBulkVerifyClick = useCallback(
    async (artists: Artist[], refetch: () => void) => {
      try {
        await Promise.all(artists.map((a) => adminApi.verifyArtist(a.id)));
        refetch();
      } catch (error) {
        console.error("Failed to bulk verify artists:", error);
        throw error;
      }
    },
    []
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!artistToDelete) return;

    try {
      await artistApi.delete(artistToDelete.id);
      setIsDeleteModalOpen(false);
      setArtistToDelete(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to delete artist:", error);
      throw error;
    }
  }, [artistToDelete]);

  const handleBulkDeleteClick = useCallback(
    (artists: Artist[], refetch: () => void) => {
      setArtistsToBulkDelete(artists);
      setIsBulkDeleteModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleConfirmBulkDelete = useCallback(async () => {
    if (artistsToBulkDelete.length === 0) return;

    try {
      await Promise.all(artistsToBulkDelete.map((a) => artistApi.delete(a.id)));
      setIsBulkDeleteModalOpen(false);
      setArtistsToBulkDelete([]);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to bulk delete artists:", error);
      throw error;
    }
  }, [artistsToBulkDelete]);

  const actions = useMemo<DataTableAction<Artist>[]>(
    () => [
      {
        id: "edit",
        icon: LuSquarePen,
        label: "Edit Artist",
        onClick: handleEditClick,
      },
      {
        id: "verify",
        icon: LuBadgeCheck,
        label: "Toggle Verification",
        onClick: handleVerifyClick,
      },
      {
        id: "delete",
        icon: LuTrash2,
        label: "Delete Artist",
        onClick: handleDeleteClick,
        variant: "danger",
      },
    ],
    [handleDeleteClick, handleEditClick, handleVerifyClick]
  );

  const bulkActions = useMemo<DataTableBulkAction<Artist>[]>(
    () => [
      {
        id: "verify",
        icon: LuBadgeCheck,
        label: "Verify Artists",
        onClick: handleBulkVerifyClick,
      },
      {
        id: "delete",
        icon: LuTrash2,
        label: "Delete Artists",
        onClick: handleBulkDeleteClick,
        variant: "danger",
      },
    ],
    [handleBulkDeleteClick, handleBulkVerifyClick]
  );

  return (
    <>
      <DataTable
        fetchData={fetchArtists}
        columns={artistColumns}
        filterKeys={artistFilterKeys}
        actions={actions}
        bulkActions={bulkActions}
        cacheKey="admin-manage-content-artists"
        dependencies={[accessContext]}
        initialRowsPerPage={25}
        rowsPerPageOptions={[10, 25, 50, 100]}
        theme="dark"
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setArtistToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Artist"
        message="Are you sure you want to delete this artist? This action cannot be undone."
        confirmButtonText="Delete"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => {
          setIsBulkDeleteModalOpen(false);
          setArtistsToBulkDelete([]);
        }}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Multiple Artists"
        message={`Are you sure you want to delete ${
          artistsToBulkDelete.length
        } artist${
          artistsToBulkDelete.length === 1 ? "" : "s"
        }? This action cannot be undone.`}
        confirmButtonText="Delete All"
        isDangerous={true}
      />

      {artistToEdit && (
        <EditArtistModal
          isOpen={isArtistEditModalOpen}
          onClose={() => setIsArtistEditModalOpen(false)}
          artist={artistToEdit}
          onArtistEdited={handleArtistEdited}
          adminMode
        />
      )}
    </>
  );
};

export default memo(AdminManageContentArtists);
