import { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useAuth, useContextMenu } from "@contexts";
import type {
  ContextMenuAction,
  ContextMenuEntity,
  ContextMenuEntityType,
} from "@contexts";
import type { UUID, Song } from "@types";
import { useAsyncData, useErrorCheck } from "@hooks";
import { playlistApi } from "@api";
import {
  ErrorPage,
  PageLoader,
  SongsList,
  LikeProfiles,
  RelatedPlaylists,
  PlaylistContainer,
  PlaylistUser,
  PlaylistDescription,
  PlaylistActions,
  CreatePlaylistModal,
} from "@components";
import { LuTrash } from "react-icons/lu";
import styles from "./PlaylistPage.module.css";

const PlaylistPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  const { user, isAuthenticated } = useAuth();
  const { setCustomActionsProvider } = useContextMenu();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const songsRefetchRef = useRef<(() => void) | null>(null);

  if (!id) {
    return (
      <ErrorPage
        title="Playlist Not Found"
        message="The requested playlist does not exist."
      />
    );
  }

  const { data, loading, error, refetch } = useAsyncData(
    {
      playlist: () =>
        playlistApi.getPlaylistById(id, {
          includeUser: true,
          includeSongCount: true,
          includeLikes: true,
          includeRuntime: true,
        }),
    },
    [id],
    {
      cacheKey: `playlist_${id}`,
      hasBlobUrl: true,
    }
  );

  const playlist = data?.playlist;

  const fetchSongs = useCallback(
    () =>
      playlistApi.getSongs(id, { includeArtists: true, includeAlbums: true }),
    [id]
  );

  const isOwner = useMemo(() => {
    if (!user || !isAuthenticated || !playlist) {
      return false;
    }
    return user.id === playlist.created_by;
  }, [user, isAuthenticated, playlist]);

  const handleEditPlaylist = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handlePlaylistEdited = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRemoveSong = useCallback(
    async (song: Song) => {
      if (!isOwner || !playlist) return;

      try {
        await playlistApi.removeSongs(playlist.id, [song.id]);
        songsRefetchRef.current?.();
        refetch();
      } catch (error) {
        console.error("Error removing song from playlist:", error);
      }
    },
    [isOwner, playlist, refetch]
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
          id: "remove-from-playlist",
          label: "Remove from Playlist",
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
      condition: !playlist && !loading,
      title: "Playlist Not Found",
      message: "The requested playlist does not exist.",
    },
    {
      condition: !!playlist && !playlist.is_public && !isOwner,
      title: "Playlist Not Found",
      message: "The requested playlist does not exist.",
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
        <title>
          {playlist ? `${playlist.title} - CoogMusic` : "CoogMusic"}
        </title>
      </Helmet>

      <div className={styles.playlistLayout}>
        <div className={styles.playlistLayoutTop}>
          <PlaylistContainer
            playlist={playlist}
            isOwner={isOwner}
            onEditButtonClick={handleEditPlaylist}
          />
          <div className={styles.playlistLayoutTopRight}>
            {playlist?.user && <PlaylistUser user={playlist.user} />}
            <PlaylistDescription
              description={playlist?.description}
              updatedAt={playlist.updated_at}
            />
            <PlaylistActions playlist={playlist} />
          </div>
        </div>
        <div className={styles.playlistLayoutBottom}>
          {(playlist.song_count ?? 0) > 0 ? (
            <SongsList
              fetchData={fetchSongs}
              cacheKey={`playlist_${id}_songs`}
              dependencies={[id]}
              onRefetchNeeded={songsRefetchRef}
            />
          ) : (
            <div className={styles.noSongsMessage}>
              This playlist has no songs.
            </div>
          )}
          <div className={styles.suggestionsContainer}>
            <LikeProfiles
              title="Liked By"
              entityId={playlist.id}
              entityType="playlist"
              profileMin={4}
              profileLimit={6}
            />
            {playlist.user?.id && (
              <RelatedPlaylists
                mode="user"
                userId={playlist.user.id}
                username={playlist.user.username}
                playlistId={playlist.id}
              />
            )}
            <RelatedPlaylists mode="related" playlistId={playlist.id} />
          </div>
        </div>
      </div>

      {isOwner && (
        <CreatePlaylistModal
          mode="edit"
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          playlist={playlist}
          onPlaylistCreated={handlePlaylistEdited}
        />
      )}
    </>
  );
};

export default memo(PlaylistPage);
