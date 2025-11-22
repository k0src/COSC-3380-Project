import { memo, useState, useMemo, useCallback, useRef } from "react";
import type {
  ArtistAlbum,
  DataTableAction,
  DataTableBulkAction,
  AccessContext,
  UUID,
} from "@types";
import { DataTable, ConfirmationModal, EditAlbumModal } from "@components";
import { artistApi, albumApi } from "@api";
import {
  albumColumns,
  albumFilterKeys,
} from "@components/DataTable/columnDefinitions";
import { LuTrash2, LuSquarePen, LuPin } from "react-icons/lu";

export interface ArtistDashboardManageAlbumsProps {
  artistId: UUID;
  accessContext: AccessContext;
}

const ArtistDashboardManageAlbums: React.FC<
  ArtistDashboardManageAlbumsProps
> = ({ artistId, accessContext }) => {
  const [isAlbumEditModalOpen, setIsAlbumEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isUnPinModalOpen, setIsUnPinModalOpen] = useState(false);

  const [albumToEdit, setAlbumToEdit] = useState<ArtistAlbum | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<ArtistAlbum | null>(null);
  const [albumToPin, setAlbumToPin] = useState<ArtistAlbum | null>(null);
  const [albumsToBulkDelete, setAlbumsToBulkDelete] = useState<ArtistAlbum[]>(
    []
  );

  const refetchRef = useRef<(() => void) | null>(null);

  const fetchArtistAlbums = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return artistApi.getAlbums(artistId, accessContext, {
        includeLikes: true,
        includeSongCount: true,
        limit,
        offset,
      });
    },
    [artistId, accessContext]
  );

  const handleDeleteClick = useCallback(
    (album: ArtistAlbum, refetch: () => void) => {
      setAlbumToDelete(album);
      setIsDeleteModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleEditClick = useCallback(
    (album: ArtistAlbum, refetch: () => void) => {
      setAlbumToEdit(album);
      setIsAlbumEditModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handlePinClick = useCallback(
    (album: ArtistAlbum, refetch: () => void) => {
      setAlbumToPin(album);
      if (album.is_pinned) {
        setIsUnPinModalOpen(true);
      } else {
        setIsPinModalOpen(true);
      }
      refetchRef.current = refetch;
    },
    []
  );

  const handleConfirmPin = useCallback(async () => {
    if (!albumToPin) return;

    try {
      await artistApi.pinAlbumToArtistPage(artistId, albumToPin.id);
      setIsPinModalOpen(false);
      setAlbumToPin(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to pin album to artist page:", error);
      throw error;
    }
  }, [albumToPin, artistId]);

  const handleConfirmUnPin = useCallback(async () => {
    if (!albumToPin) return;

    try {
      await artistApi.unPinAlbumFromArtistPage(artistId, albumToPin.id);
      setIsPinModalOpen(false);
      setAlbumToPin(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to unpin album from artist page:", error);
      throw error;
    }
  }, [albumToPin, artistId]);

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
    (albums: ArtistAlbum[], refetch: () => void) => {
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

  const actions = useMemo<DataTableAction<ArtistAlbum>[]>(
    () => [
      {
        id: "edit",
        icon: LuSquarePen,
        label: "Edit Album",
        onClick: handleEditClick,
      },
      {
        id: "pin",
        icon: LuPin,
        label: "Pin Album To Artist Page",
        onClick: handlePinClick,
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

  const bulkActions = useMemo<DataTableBulkAction<ArtistAlbum>[]>(
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
        fetchData={fetchArtistAlbums}
        columns={albumColumns}
        filterKeys={albumFilterKeys}
        actions={actions}
        bulkActions={bulkActions}
        cacheKey={`artist-${artistId}-albums`}
        dependencies={[artistId, accessContext]}
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

      <ConfirmationModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setAlbumToPin(null);
        }}
        onConfirm={handleConfirmPin}
        title="Pin Album to Artist Page"
        message={`Are you sure you want to pin the album "${albumToPin?.title}" to your artist page? Only one album can be pinned at a time. If another album is already pinned, it will be unpinned.`}
        confirmButtonText="Pin Album"
      />

      <ConfirmationModal
        isOpen={isUnPinModalOpen}
        onClose={() => {
          setIsUnPinModalOpen(false);
          setAlbumToPin(null);
        }}
        onConfirm={handleConfirmUnPin}
        message="Are you sure you want to unpin this album from your artist page?"
        title="Unpin Album from Artist Page"
        confirmButtonText="Unpin Album"
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

export default memo(ArtistDashboardManageAlbums);
