import { memo, useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import type {
  Playlist,
  DataTableAction,
  DataTableBulkAction,
  AccessContext,
  UUID,
} from "@types";
import { DataTable, ConfirmationModal, CreatePlaylistModal } from "@components";
import { artistApi, playlistApi } from "@api";
import {
  playlistColumns,
  playlistFilterKeys,
} from "@components/DataTable/columnDefinitions";
import styles from "./ArtistDashboardManagePlaylists.module.css";
import { LuTrash2, LuSquarePen } from "react-icons/lu";

export interface ArtistDashboardManagePlaylistsProps {
  artistId: UUID;
  accessContext: AccessContext;
}

const ArtistDashboardManagePlaylists: React.FC<
  ArtistDashboardManagePlaylistsProps
> = ({ artistId, accessContext }) => {
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

  const refetchRef = useRef<(() => void) | null>(null);

  const fetchArtistPlaylists = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return artistApi.getArtistPlaylists(artistId, accessContext, {
        limit,
        offset,
        includeUser: true,
        includeLikes: true,
        includeSongCount: true,
      });
    },
    [artistId, accessContext]
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
        id: "delete",
        icon: LuTrash2,
        label: "Delete Playlist",
        onClick: handleDeleteClick,
        variant: "danger",
      },
    ],
    [handleDeleteClick, handleEditClick]
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
        fetchData={fetchArtistPlaylists}
        columns={playlistColumns}
        filterKeys={playlistFilterKeys}
        noDataMessage={
          <span className={styles.noDataMessage}>
            Artist playlists are pinned to your artist profile.{" "}
            <Link to="/artist-dashboard/add" className={styles.noDataLink}>
              Create your first artist playlist now!
            </Link>
          </span>
        }
        actions={actions}
        bulkActions={bulkActions}
        cacheKey={`artist-${artistId}-playlists`}
        dependencies={[artistId, accessContext]}
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

      {playlistToEdit && (
        <CreatePlaylistModal
          mode="edit"
          isOpen={isPlaylistEditModalOpen}
          onClose={() => setIsPlaylistEditModalOpen(false)}
          playlist={playlistToEdit}
          onPlaylistCreated={handlePlaylistEdited}
        />
      )}
    </>
  );
};

export default memo(ArtistDashboardManagePlaylists);
