import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { songApi } from "@api";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
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
} from "@components";
import styles from "./SongPage.module.css";

const SongPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

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

  const { data, loading, error } = useAsyncData(asyncConfig, [id], {
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

  if (error) {
    return (
      <>
        <Helmet>
          <title>Internal Server Error</title>
        </Helmet>
        <ErrorPage
          title="Internal Server Error"
          message="An unexpected error occurred. Please try again later."
        />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{song ? `${song.title} - CoogMusic` : "CoogMusic"}</title>
      </Helmet>

      {loading ? (
        <PageLoader />
      ) : (
        <div className={styles.songLayout}>
          <div className={styles.songLayoutTop}>
            <SongContainer
              song={song}
              mainArtist={mainArtist ?? undefined}
              coverGradient={coverGradient}
              numberComments={song.comments}
            />
            <div className={styles.songLayoutTopRight}>
              <SongStats songId={song.id} />
              <SongDetails genre={song.genre} releaseDate={song.release_date} />
              <SongActions
                songId={song.id}
                songTitle={song.title}
                songUrl={window.location.href}
              />
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
      )}
    </>
  );
};

export default SongPage;
