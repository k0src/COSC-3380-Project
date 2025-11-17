import { useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { songApi } from "@api";
import { useAuth } from "@contexts";
import type { UUID } from "@types";
import { useAsyncData, useErrorCheck } from "@hooks";
import {
  ErrorPage,
  SongContainer,
  SongStats,
  SongDetails,
  SongActions,
  ArtistInfo,
  SongComments,
  SongSuggestions,
  PageLoader,
  EditSongModal,
} from "@components";
import styles from "./SongPage.module.css";

const SongPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  const { user, isAuthenticated } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!id) {
    return (
      <ErrorPage
        title="Song Not Found"
        message="The requested song does not exist."
      />
    );
  }

  const asyncConfig = useMemo(
    () => ({
      song: () =>
        songApi.getSongById(id, {
          includeAlbums: true,
          includeArtists: true,
          includeLikes: true,
          includeComments: true,
        }),
      coverGradient: () => songApi.getCoverGradient(id),
    }),
    [id]
  );

  const { data, loading, error, refetch } = useAsyncData(asyncConfig, [id], {
    cacheKey: `song_${id}`,
    hasBlobUrl: true,
  });

  const song = data?.song;
  const coverGradient = data?.coverGradient;

  const { mainArtist, otherArtists } = useMemo(() => {
    if (!song?.artists?.length) {
      return { mainArtist: null, otherArtists: [] };
    }

    const main =
      song.artists.find((artist) => artist.role === "Main") ?? song.artists[0];
    const others = song.artists.filter((artist) => artist.role !== "Main");

    return { mainArtist: main, otherArtists: others };
  }, [song?.artists]);

  const isOwner = useMemo(() => {
    if (!user || !isAuthenticated || !song) {
      return false;
    }
    return user.id === song.created_by;
  }, [user, isAuthenticated, song]);

  const handleEditSong = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleSongEdited = useCallback(() => {
    refetch();
  }, [refetch]);

  const { shouldShowError, errorTitle, errorMessage } = useErrorCheck([
    {
      condition: !!error,
      title: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
    },
    {
      condition: !song && !loading,
      title: "Song Not Found",
      message: "The requested song does not exist.",
    },
    {
      condition: song?.visibility_status === "PRIVATE" && !isOwner,
      title: "Song Not Found",
      message: "The requested song does not exist.",
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
        <title>{song ? `${song.title} - CoogMusic` : "CoogMusic"}</title>
      </Helmet>

      <div className={styles.songLayout}>
        <div className={styles.songLayoutTop}>
          <SongContainer
            song={song}
            mainArtist={mainArtist ?? undefined}
            coverGradient={coverGradient}
            numberComments={song.comments}
            isOwner={isOwner}
            onEditButtonClick={handleEditSong}
          />
          <div className={styles.songLayoutTopRight}>
            <SongStats songId={song.id} />
            <SongDetails genre={song.genre} releaseDate={song.release_date} />
            <SongActions song={song} songUrl={window.location.href} />
          </div>
        </div>
        <div className={styles.songLayoutBottom}>
          <ArtistInfo
            mainArtist={mainArtist ?? undefined}
            otherArtists={otherArtists}
          />
          <SongComments songId={song.id} />
          <SongSuggestions song={song} mainArtist={mainArtist ?? undefined} />
        </div>
      </div>

      {isOwner && (
        <EditSongModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          song={song}
          onSongEdited={handleSongEdited}
        />
      )}
    </>
  );
};

export default SongPage;
