import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";
import WaveSurfer from "wavesurfer.js";
import { useElementWidth } from "@hooks";
import { useAudioQueue } from "@contexts";
import classNames from "classnames";
import styles from "./WaveformPlayer.module.css";
import { LuCirclePause, LuCirclePlay } from "react-icons/lu";

const BAR_WIDTH = 3;
const BAR_GAP = 5;
const WAVEFORM_HEIGHT = 80;
const BAR_RADIUS = 6;
const LINE_WIDTH = 2;
const SKELETON_PADDING = 8;

export interface WaveformPlayerProps {
  audioSrc: string;
  captureKeyboard?: boolean;
  onPlay?: () => void;
  disabled?: boolean;
}

const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioSrc,
  captureKeyboard,
  onPlay,
  disabled,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const { state, actions } = useAudioQueue();
  const { isPlaying, progress, duration, currentSong, error } = state;

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const skeletonBarsRef = useRef<number[]>([]);
  const prevCurrentSongRef = useRef<string | null>(null);

  const isCurrentSong = currentSong?.audio_url === audioSrc;

  const rawWidth = useElementWidth(measureRef);
  const wrapperWidth = useMemo(
    () => Math.floor(rawWidth / 10) * 10,
    [rawWidth]
  );

  const barSlot = BAR_WIDTH + BAR_GAP;
  const skeletonCount = Math.max(
    1,
    Math.floor((wrapperWidth - SKELETON_PADDING) / barSlot)
  );

  if (skeletonBarsRef.current.length !== skeletonCount) {
    skeletonBarsRef.current = new Array(skeletonCount)
      .fill(0)
      .map(() => 20 + Math.floor(Math.random() * 80));
  }

  const skeletonBars = skeletonBarsRef.current;

  const togglePlay = useCallback(() => {
    if (isCurrentSong) {
      if (isPlaying) {
        actions.pause();
      } else {
        actions.resume();
      }
    } else {
      onPlay?.();
    }
  }, [isCurrentSong, isPlaying, actions, onPlay]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    setTimeout(() => setShowSkeleton(false), 100);
  }, []);

  const handleWaveformClick = useCallback(
    (relativeX: number) => {
      const ws = wavesurferRef.current;
      if (!ws) return;

      if (state.currentSong?.audio_url !== audioSrc) return;

      if (state.duration > 0) {
        const seekTime = relativeX * state.duration;
        actions.seek(seekTime);
      }
    },
    [audioSrc, actions]
  );

  const handleError = useCallback((error: any) => {
    console.error("WaveSurfer error:", error);
    setIsReady(false);
  }, []);

  useEffect(() => {
    if (!captureKeyboard || !isCurrentSong) return;

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
    return () =>
      window.removeEventListener("keydown", handleKeyPress, {
        capture: true,
      });
  }, [captureKeyboard, togglePlay, isCurrentSong]);

  useEffect(() => {
    setShowSkeleton(true);
    setIsReady(false);
  }, [audioSrc]);

  const hoverPlugin = useMemo(
    () =>
      Hover.create({
        lineColor: "#B22323",
        lineWidth: LINE_WIDTH,
        labelBackground: "#B22323",
        labelColor: "#F6F6F6",
        labelSize: "11px",
      }),
    []
  );

  useEffect(() => {
    if (!waveformRef.current || !audioSrc) return;

    const loadAudioWithCORSBypass = async () => {
      try {
        const ws = WaveSurfer.create({
          container: waveformRef.current!,
          height: WAVEFORM_HEIGHT,
          waveColor: "#F6F6F6",
          progressColor: "#d53131",
          barWidth: BAR_WIDTH,
          barRadius: BAR_RADIUS,
          barGap: BAR_GAP,
          normalize: true,
          backend: "MediaElement" as const,
          sampleRate: 44100,
          autoplay: false,
          plugins: [hoverPlugin],
        });

        ws.on("ready", handleReady);
        ws.on("error", handleError);
        wavesurferRef.current = ws;

        const urlParts = audioSrc.split("/");
        const filename = urlParts[urlParts.length - 1].split("?")[0];

        const proxyUrl = `/api/proxy/audio/${filename}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const decodedData = await audioContext.decodeAudioData(arrayBuffer);

        const channelsNumber = decodedData.numberOfChannels;
        const peaks =
          channelsNumber > 1
            ? [decodedData.getChannelData(0), decodedData.getChannelData(1)]
            : [decodedData.getChannelData(0)];
        const duration = decodedData.duration;

        ws.load(proxyUrl, peaks, duration);
      } catch (error) {
        console.error("Failed to load audio:", error);
        handleError(error);
      }
    };

    loadAudioWithCORSBypass();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.un("ready", handleReady);
        wavesurferRef.current.un("error", handleError);
        wavesurferRef.current.destroy();
      }
    };
  }, [audioSrc, handleReady, handleError, hoverPlugin]);

  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;

    ws.on("click", handleWaveformClick);
    return () => {
      ws.un("click", handleWaveformClick);
    };
  }, [handleWaveformClick]);

  useEffect(() => {
    if (!wavesurferRef.current) return;

    const currentAudioUrl = currentSong?.audio_url || null;
    const prevAudioUrl = prevCurrentSongRef.current;

    if (currentAudioUrl !== prevAudioUrl) {
      prevCurrentSongRef.current = currentAudioUrl;

      if (currentAudioUrl === audioSrc) {
        return;
      } else {
        wavesurferRef.current.seekTo(0);
        return;
      }
    }

    if (isCurrentSong && duration > 0 && progress > 1) {
      const progressPercent = progress / duration;
      wavesurferRef.current.seekTo(progressPercent);
    }
  }, [currentSong?.audio_url, audioSrc, isCurrentSong, progress, duration]);

  return (
    <div className={styles.playerContainer}>
      <button
        onClick={togglePlay}
        className={classNames(styles.playerPlayBtn, {
          [styles.playerPlayBtnActive]: isCurrentSong && isPlaying,
        })}
        aria-label={
          isCurrentSong && error
            ? "Audio unavailable"
            : isCurrentSong && isPlaying
            ? "Pause"
            : "Play"
        }
        disabled={disabled || !isReady || (isCurrentSong && !!error)}
        title={isCurrentSong && error ? error : undefined}
      >
        {isCurrentSong && isPlaying ? <LuCirclePause /> : <LuCirclePlay />}
      </button>

      <div ref={measureRef} className={styles.waveWrapper}>
        {showSkeleton && (
          <div className={styles.skeletonWaveform} aria-hidden="true">
            {skeletonBars.map((h, i) => (
              <div
                key={i}
                className={styles.skeletonBar}
                style={{ height: `${h}%`, width: `${BAR_WIDTH}px` }}
              />
            ))}
          </div>
        )}

        <div
          ref={waveformRef}
          className={classNames(styles.playerWaveform, {
            [styles.hiddenWaveform]: showSkeleton,
          })}
        />
      </div>
    </div>
  );
};

export default memo(WaveformPlayer);
