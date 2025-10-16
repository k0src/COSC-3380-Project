import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { songApi } from "../../api/song.api.js";
import type {
  Song,
  Artist,
  Album,
  SongArtist,
  UUID,
  CoverGradient,
  RGB,
} from "../../types";
import styles from "./SongPage.module.css";
import { MainLayout } from "../../components/index.js";
import { useAsyncData } from "../../hooks/useAsyncData";
import { PageLoader } from "../../components/index.js";
import {
  LuThumbsUp,
  LuPlay,
  LuMessageSquareText,
  LuCirclePlay,
  LuCirclePause,
  LuListPlus,
  LuShare,
  LuCircleAlert,
  LuMusic,
  LuChartLine,
  LuCalendar,
  LuUserRoundPlus,
  LuUserRoundCheck,
} from "react-icons/lu";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";
import WaveSurfer from "wavesurfer.js";
import classNames from "classnames";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import type { SparkLineChartProps } from "@mui/x-charts/SparkLineChart";
import {
  areaElementClasses,
  lineElementClasses,
} from "@mui/x-charts/LineChart";
import { chartsAxisHighlightClasses } from "@mui/x-charts/ChartsAxisHighlight";
import userPlaceholder from "../../../assets/user-placeholder.png";

const formatDate = (dateString: string): string => dateString.split("T")[0];

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

const sparkLineSettings: SparkLineChartProps = {
  data: DUMMY_PLAYS,
  baseline: "min",
  xAxis: { id: "week-axis", data: DUMMY_WEEKS },
  yAxis: {
    domainLimit: (_, maxValue: number) => ({
      min: -maxValue / 6,
      max: maxValue,
    }),
  },
  sx: {
    [`& .${areaElementClasses.root}`]: { opacity: 0.2 },
    [`& .${lineElementClasses.root}`]: { strokeWidth: 3 },
    [`& .${chartsAxisHighlightClasses.root}`]: {
      stroke: "rgb(213, 49, 49)",
      strokeDasharray: "none",
      strokeWidth: 2,
    },
  },
  slotProps: {
    lineHighlight: { r: 4 },
  },
  clipAreaOffset: { top: 2, bottom: 2 },
  axisHighlight: { x: "line" },
};

const SongPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  const [isLiked, setIsLiked] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);

  // FIX LATER
  if (!id) {
    return <div>Invalid song ID</div>;
  }

  const { data, loading, error } = useAsyncData(
    {
      song: () =>
        songApi.getSongById(id, {
          includeAlbum: true,
          includeArtists: true,
          includeLikes: true,
        }),
      coverGradient: () => songApi.getCoverGradient(id),
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

    const main = song.artists.find((artist) => artist.role === "Main") || null;
    const others =
      song.artists.filter((artist) => artist.role !== "Main") || [];

    return { mainArtist: main, otherArtists: others };
  }, [song]);

  const [wavesurfer, setWavesurfer] = useState<{
    playPause: () => void;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  interface OnReadyEvent {
    playPause: () => void;
  }

  const onReady = (ws: OnReadyEvent): void => {
    setWavesurfer(ws);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (wavesurfer) wavesurfer.playPause();
  };

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        e.target instanceof HTMLElement &&
        !["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyPress, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyPress, { capture: true });
    };
  }, [wavesurferRef.current]);

  useEffect(() => {
    if (!waveformRef.current || !song.audio_url) return;
    // f8a9a9
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      height: 80,
      waveColor: "#F6F6F6",
      progressColor: "#d53131",
      barWidth: 4,
      barRadius: 6,
      barGap: 6,
      normalize: true,
      backend: "MediaElement",
      sampleRate: 44100,
      url: song.audio_url,
      autoplay: false,
      plugins: [
        Hover.create({
          lineColor: "#B22323",
          lineWidth: 2,
          labelBackground: "#B22323",
          labelColor: "#F6F6F6",
          labelSize: "11px",
        }),
      ],
    });

    ws.on("ready", () => {
      onReady(ws);
      setIsPlaying(false);
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [song?.audio_url]);

  if (error) {
    return (
      <>
        <Helmet>
          <title>Internal Server Error</title>
        </Helmet>
        <p>{String(error)}</p> {/* fix */}
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{song ? `${song.title} - CoogMusic` : "CoogMusic"}</title>
      </Helmet>
      <MainLayout>
        {loading ? (
          <PageLoader />
        ) : (
          <div className={styles.songLayout}>
            <div className={styles.songLayoutTop}>
              <div
                className={styles.songContainer}
                style={
                  {
                    "--cover-gradient-color1": `rgba(${coverGradient.color1.r}, ${coverGradient.color1.g}, ${coverGradient.color1.b}, 0.2)`,
                    "--cover-gradient-color2": `rgba(${coverGradient.color2.r}, ${coverGradient.color2.g}, ${coverGradient.color2.b}, 0.2)`,
                  } as React.CSSProperties
                }
              >
                <img
                  src={song.image_url!}
                  alt={`${song.title} Cover`}
                  className={styles.coverImage}
                />
                <div className={styles.songRight}>
                  <div className={styles.songInfoContainer}>
                    <span className={styles.artistName}>
                      {mainArtist?.display_name}
                    </span>
                    <span className={styles.songTitle}>{song.title}</span>
                    <div className={styles.interactionsContainer}>
                      <div className={styles.interactionStat}>
                        <LuPlay />
                        <span className={styles.interactionText}>1,219</span>
                      </div>
                      <div className={styles.interactionStat}>
                        <LuThumbsUp />
                        <span className={styles.interactionText}>
                          {song?.likes}
                        </span>
                      </div>
                      <div className={styles.interactionStat}>
                        <LuMessageSquareText />
                        <span className={styles.interactionText}>100</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.playerContainer}>
                    <button
                      onClick={togglePlay}
                      className={classNames(styles.playerPlayBtn, {
                        [styles.playerPlayBtnActive]: isPlaying,
                      })}
                    >
                      {isPlaying ? <LuCirclePause /> : <LuCirclePlay />}
                    </button>
                    <div
                      ref={waveformRef}
                      className={styles.playerWaveform}
                    ></div>
                  </div>
                </div>
              </div>
              <div className={styles.songLayoutTopRight}>
                <div className={styles.songStatsContainer}>
                  <span className={styles.statsText}>Weekly Plays</span>
                  <SparkLineChart
                    height={80}
                    width={290}
                    area
                    showHighlight
                    color="rgb(213, 49, 49)"
                    className={styles.playsChart}
                    {...sparkLineSettings}
                  />
                </div>
                <div className={styles.detailsContainer}>
                  <div className={styles.detailsColumn}>
                    <span className={styles.detailLabel}>Genre</span>
                    <div className={styles.detailWrapper}>
                      <LuMusic className={styles.detailIcon} />
                      <span
                        className={classNames(
                          styles.detailName,
                          styles.genreName
                        )}
                      >
                        {song.genre}
                      </span>
                    </div>
                  </div>
                  <div className={styles.detailsColumn}>
                    <span className={styles.detailLabel}>Release Date</span>
                    <div className={styles.detailWrapper}>
                      <LuCalendar className={styles.detailIcon} />
                      <span className={styles.detailName}>
                        {formatDate(song.release_date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.songActionsContainer}>
                  <button
                    className={classNames(styles.actionButton, {
                      [styles.actionButtonActive]: isLiked,
                    })}
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <LuThumbsUp />
                  </button>
                  <button className={styles.actionButton}>
                    <LuListPlus />
                  </button>
                  <button className={styles.actionButton}>
                    <LuShare />
                  </button>
                  <button className={styles.actionButton}>
                    <LuCircleAlert />
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.songLayoutBottom}>
              <div className={styles.songBottomLeft}>
                <div className={styles.songBottomTop}>
                  <div className={styles.artistInfoContainer}>
                    <div className={styles.artistInfoLeft}>
                      <img
                        src={
                          mainArtist?.user?.profile_picture_url
                            ? mainArtist?.user?.profile_picture_url
                            : userPlaceholder
                        }
                        alt={`${mainArtist?.display_name} Image`}
                        className={styles.artistImage}
                      />
                      <button
                        className={classNames(styles.artistFollowButton, {
                          [styles.artistFollowButtonActive]: isFollowed,
                        })}
                        onClick={() => setIsFollowed(!isFollowed)}
                      >
                        {isFollowed ? (
                          <>
                            Followed <LuUserRoundCheck />
                          </>
                        ) : (
                          <>
                            Follow <LuUserRoundPlus />
                          </>
                        )}
                      </button>
                    </div>
                    <div className={styles.artistInfoRight}>
                      <span className={styles.artistInfoName}>
                        {mainArtist?.display_name}
                      </span>
                      {mainArtist?.bio ? (
                        <div className={styles.artistBio}>
                          {mainArtist?.bio}
                        </div>
                      ) : (
                        <div
                          className={classNames(
                            styles.artistBio,
                            styles.artistBioNone
                          )}
                        >
                          {mainArtist?.display_name} has no bio yet...
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.albumInfoContainer}></div>
                </div>
                <div className={styles.commentsContainer}></div>
              </div>
              <div className={styles.suggestionsContainer}>
                <div className={styles.relatedSongsContainer}></div>
                <div className={styles.inPlaylistsContainer}></div>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </>
  );
};

export default SongPage;
