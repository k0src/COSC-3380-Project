import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { songApi } from "../../api/song.api.js";
import type { Song, Artist, Album, SongArtist, UUID } from "../../types";
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
} from "react-icons/lu";
import WavesurferPlayer from "@wavesurfer/react";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";
import WaveSurfer from "wavesurfer.js";

const SongPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

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
    },
    [id],
    { cacheKey: `song_${id}`, hasBlobUrl: true }
  );

  const song = data?.song;

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

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      height: 180,
      waveColor: "#F6F6F6",
      progressColor: "#d53131",
      barWidth: 4,
      barRadius: 6,
      barGap: 4,
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
              <div className={styles.songContainer}>
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
                        <LuPlay className={styles.interactionIcon} />
                        <span className={styles.interactionText}>1,219</span>
                      </div>
                      <div className={styles.interactionStat}>
                        <LuThumbsUp className={styles.interactionIcon} />
                        <span className={styles.interactionText}>
                          {song?.likes}
                        </span>
                      </div>
                      <div className={styles.interactionStat}>
                        <LuMessageSquareText
                          className={styles.interactionIcon}
                        />
                        <span className={styles.interactionText}>100</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.playerContainer}>
                    <button
                      onClick={togglePlay}
                      className={styles.playerPlayBtn}
                    >
                      {isPlaying ? (
                        <LuCirclePause className={styles.playerPlayBtnIcon} />
                      ) : (
                        <LuCirclePlay className={styles.playerPlayBtnIcon} />
                      )}
                    </button>
                    <div
                      ref={waveformRef}
                      className={styles.playerWaveform}
                    ></div>
                  </div>
                </div>
              </div>
              <div className={styles.songActionsContainer}></div>
            </div>
            <div className={styles.songLayoutBottom}>
              <div className={styles.artistInfoContainer}></div>
              <div className={styles.commentsContainer}></div>
              <div className={styles.suggestionsContainer}>
                <div className={styles.songStatsContainer}></div>
                <div className={styles.relatedSongsContainer}></div>
                <div className={styles.albumInfoContainer}></div>
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
