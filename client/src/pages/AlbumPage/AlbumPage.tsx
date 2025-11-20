import { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useAuth, useContextMenu } from "@contexts";
import type {
  ContextMenuAction,
  ContextMenuEntity,
  ContextMenuEntityType,
} from "@contexts";
import type { UUID, Song, AccessContext } from "@types";
import { useAsyncData, useErrorCheck } from "@hooks";
import { albumApi } from "@api";
import {
  ErrorPage,
  PageLoader,
  AlbumContainer,
  SongsList,
  LikeProfiles,
  AlbumArtist,
  AlbumInfo,
  AlbumActions,
  RelatedAlbums,
  EditAlbumModal,
} from "@components";
import { LuTrash } from "react-icons/lu";
import styles from "./AlbumPage.module.css";

const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  const { user, isAuthenticated } = useAuth();
  const { setCustomActionsProvider } = useContextMenu();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const songsRefetchRef = useRef<(() => void) | null>(null);

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "single",
  };

  if (!id) {
    return (
      <ErrorPage
        title="Album Not Found"
        message="The requested album does not exist."
      />
    );
  }

  const { data, loading, error, refetch } = useAsyncData(
    {
      album: () =>
        albumApi.getAlbumById(id, accessContext, {
          includeArtist: true,
          includeLikes: true,
          includeSongCount: true,
          includeRuntime: true,
          includeSongIds: true,
        }),
    },
    [id],
    {
      cacheKey: `album_${id}`,
      hasBlobUrl: true,
    }
  );

  const album = data?.album;

  const fetchSongs = useCallback(async () => {
    const result = await albumApi.getSongs(id, accessContext, {
      includeArtists: true,
    });
    return result ?? [];
  }, [id, accessContext]);

  const isOwner = useMemo(() => {
    if (!user || !isAuthenticated || !album) {
      return false;
    }
    return user.id === album.owner_id;
  }, [user, isAuthenticated, album]);

  const handleEditAlbum = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleAlbumEdited = useCallback(() => {
    refetch();
  }, [refetch]);

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const handleRemoveSong = useCallback(
    async (song: Song) => {
      if (!isOwner) return;

      try {
        await albumApi.removeSong(id, song.id);
        songsRefetchRef.current?.();
        refetchRef.current();
      } catch (error) {
        console.error("Error removing song from album:", error);
      }
    },
    [isOwner, id]
  );

  const customActionsProvider = useCallback(
    (
      entity: ContextMenuEntity | null,
      entityType: ContextMenuEntityType | null
    ): ContextMenuAction[] => {
      if (entityType !== "song" || !isOwner) {
        return [];
      }

      const song = entity as Song;

      return [
        {
          id: "remove-from-album",
          label: "Remove from Album",
          icon: LuTrash,
          onClick: () => handleRemoveSong(song),
          show: true,
        },
      ];
    },
    [isOwner, handleRemoveSong]
  );

  useEffect(() => {
    setCustomActionsProvider(customActionsProvider);
    return () => {
      setCustomActionsProvider(null);
    };
  }, [customActionsProvider, setCustomActionsProvider]);

  const { shouldShowError, errorTitle, errorMessage } = useErrorCheck([
    {
      condition: !!error,
      title: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
    },
    {
      condition: !album && !loading,
      title: "Album Not Found",
      message: "The requested album does not exist.",
    },
    {
      condition: album?.visibility_status === "PRIVATE" && !isOwner,
      title: "Album Not Found",
      message: "The requested album does not exist.",
    },
  ]);

  if (loading) {
    return <PageLoader />;
  }

  if (shouldShowError) {
    return <ErrorPage title={errorTitle} message={errorMessage} />;
  }

  return (
    <>
      <Helmet>
        <title>{album ? `${album.title} - CoogMusic` : "CoogMusic"}</title>
      </Helmet>

      <div className={styles.albumLayout}>
        <div className={styles.albumLayoutTop}>
          <AlbumContainer
            album={album!}
            isOwner={isOwner}
            onEditButtonClick={handleEditAlbum}
          />
          <div className={styles.albumLayoutTopRight}>
            <AlbumArtist
              artist={album!.artist!}
              updatedAt={album!.updated_at}
            />
            <AlbumInfo releaseDate={album!.release_date} genre={album!.genre} />
            <AlbumActions
              album={album!}
              albumUrl={window.location.href}
              songIds={album!.song_ids ?? []}
            />
          </div>
        </div>
        <div className={styles.albumLayoutBottom}>
          {(album!.song_count ?? 0) > 0 ? (
            <SongsList
              fetchData={fetchSongs}
              cacheKey={`album_${id}_songs`}
              dependencies={[id]}
              onRefetchNeeded={songsRefetchRef}
            />
          ) : (
            <div className={styles.noSongsMessage}>
              This album has no songs.
            </div>
          )}
          <div className={styles.suggestionsContainer}>
            <LikeProfiles
              title="Liked By"
              entityId={album!.id!}
              entityType="album"
              profileMin={4}
              profileLimit={6}
            />
            <RelatedAlbums
              mode="artist"
              artistId={album!.artist?.id!}
              artistName={album!.artist?.display_name!}
              albumId={album!.id}
            />

            <RelatedAlbums mode="related" albumId={album!.id} />
          </div>
        </div>
      </div>

      {isOwner && (
        <EditAlbumModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          album={album!}
          onAlbumEdited={handleAlbumEdited}
        />
      )}
    </>
  );
};

export default memo(AlbumPage);
