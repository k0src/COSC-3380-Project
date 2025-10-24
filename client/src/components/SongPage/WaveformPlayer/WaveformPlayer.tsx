import {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";
import WaveSurfer from "wavesurfer.js";
import { useElementWidth } from "@hooks";
import classNames from "classnames";
import styles from "./WaveformPlayer.module.css";
import { LuCirclePause, LuCirclePlay } from "react-icons/lu";

// Constants
const BAR_WIDTH = 3;
const BAR_GAP = 5;
const WAVEFORM_HEIGHT = 80;
const BAR_RADIUS = 6;
const LINE_WIDTH = 2;
const SKELETON_PADDING = 8;

export interface WaveformPlayerHandle {
  play: () => void;
  pause: () => void;
  playPause: () => void;
}

export interface WaveformPlayerProps {
  audioSrc: string;
  captureKeyboard?: boolean;
  onPlay?: () => void;
  disabled?: boolean;
}

const WaveformPlayer = forwardRef<WaveformPlayerHandle, WaveformPlayerProps>(
  ({ audioSrc, captureKeyboard, onPlay, disabled }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(true);

    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const skeletonBarsRef = useRef<number[]>([]);

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

    // Imperative handle for parent
    useImperativeHandle(
      ref,
      () => ({
        play: () => wavesurferRef.current?.play(),
        pause: () => wavesurferRef.current?.pause(),
        playPause: () => wavesurferRef.current?.playPause(),
      }),
      []
    );

    // Event handlers
    const togglePlay = useCallback(() => {
      wavesurferRef.current?.playPause();
    }, []);

    const handleReady = useCallback(() => {
      setIsPlaying(false);
      setIsReady(true);
      setTimeout(() => setShowSkeleton(false), 100);
    }, []);

    const handlePlay = useCallback(() => {
      setIsPlaying(true);
      onPlay?.();
    }, [onPlay]);

    const handlePause = useCallback(() => {
      setIsPlaying(false);
    }, []);

    const handleError = useCallback((error: any) => {
      console.error("WaveSurfer error:", error);
      setIsReady(false);
    }, []);

    // Keyboard capture
    useEffect(() => {
      if (!captureKeyboard) return;

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
    }, [captureKeyboard, togglePlay]);

    useEffect(() => {
      setShowSkeleton(true);
      setIsReady(false);
    }, [audioSrc]);

    // WaveSurfer initialization
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

      const ws = WaveSurfer.create({
        container: waveformRef.current,
        height: WAVEFORM_HEIGHT,
        waveColor: "#F6F6F6",
        progressColor: "#d53131",
        barWidth: BAR_WIDTH,
        barRadius: BAR_RADIUS,
        barGap: BAR_GAP,
        normalize: true,
        backend: "MediaElement" as const,
        sampleRate: 44100,
        url: audioSrc,
        autoplay: false,
        plugins: [hoverPlugin],
      });

      ws.on("ready", handleReady);
      ws.on("play", handlePlay);
      ws.on("pause", handlePause);
      ws.on("error", handleError);
      wavesurferRef.current = ws;

      return () => {
        ws.un("ready", handleReady);
        ws.un("play", handlePlay);
        ws.un("pause", handlePause);
        ws.un("error", handleError);
        ws.destroy();
      };
    }, [
      audioSrc,
      handleReady,
      handlePlay,
      handlePause,
      handleError,
      hoverPlugin,
    ]);

    return (
      <div className={styles.playerContainer}>
        <button
          onClick={togglePlay}
          className={classNames(styles.playerPlayBtn, {
            [styles.playerPlayBtnActive]: isPlaying,
          })}
          aria-label={isPlaying ? "Pause" : "Play"}
          disabled={disabled || !isReady}
        >
          {isPlaying ? <LuCirclePause /> : <LuCirclePlay />}
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
  }
);

export default memo(WaveformPlayer);
