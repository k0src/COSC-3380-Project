import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { songApi, artistApi } from "@api";
import type { UUID } from "@types";
import { useAuth } from "@contexts";
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

const DUMMY_PLAYS = [
  2, 4, 5, 10, 21, 24, 19, 28, 40, 48, 55, 60, 62, 61, 61, 60, 59, 60, 67, 34,
  57, 59, 67, 76, 78, 65, 89, 91, 121, 123,
];
const DUMMY_WEEKS = [
  "1/1",
  "1/8",
  "1/15",
  "1/22",
  "1/29",
  "2/5",
  "2/12",
  "2/19",
  "2/26",
  "3/5",
  "3/12",
  "3/19",
  "3/26",
  "4/2",
  "4/9",
  "4/16",
  "4/23",
  "4/30",
  "5/7",
  "5/14",
  "5/21",
  "5/28",
  "6/4",
  "6/11",
  "6/18",
  "6/25",
  "7/2",
  "7/9",
  "7/16",
  "7/23",
];

const SongPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();
  const { user, isAuthenticated } = useAuth();

  if (!id) {
    return (
      <ErrorPage
        title="Song Not Found"
        message="The requested song does not exist."
      />
    );
  }

  const { data, loading, error } = useAsyncData(
    {
      song: () =>
        songApi.getSongById(id, {
          includeAlbums: true,
          includeArtists: true,
          includeLikes: true,
          includeComments: true,
        }),
      coverGradient: () => songApi.getCoverGradient(id),
      moreSongsByArtist: async () =>
        artistApi.getSongs("84a51edc-a38f-4659-974b-405b3e40f432", {
          limit: 5,
        }),
      suggestedSongs: () =>
        songApi.getSuggestedSongs(id, {
          userId: isAuthenticated && user ? user.id : undefined,
          limit: 5,
        }),
    },
    [id],
    { cacheKey: `song_${id}`, hasBlobUrl: true }
  );

  const song = data?.song;
  const coverGradient = data?.coverGradient;

  const { mainArtist, otherArtists } = useMemo(() => {
    if (!song || !song?.artists || song.artists.length === 0) {
      return { mainArtist: null, otherArtists: [] };
    }

    const main =
      song.artists.find((artist) => artist.role === "Main") || song.artists[0];
    const others =
      song.artists.filter((artist) => artist.role !== "Main") || [];

    return { mainArtist: main, otherArtists: others };
  }, [song]);

  // useStreamTracking({
  //   songId: id,
  //   wavesurferRef,
  //   onStream: (songId) => {
  //     if (isAuthenticated) {
  //       songApi.incrementSongStreams(songId);
  //     }
  //   },
  // });

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
              <SongStats
                playsData={{ weeks: DUMMY_WEEKS, plays: DUMMY_PLAYS }}
              />
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
