import { useState, useRef, useCallback, useEffect } from "react";
import type { Song } from "@types";

export interface AudioManagerActions {
  play: (song: Song) => Promise<void>;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  stop: () => void;
  setCurrentSong: (song: Song | null) => void;
}

export interface AudioManagerState {
  isPlaying: boolean;
  currentSong: Song | null;
  progress: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
}

export interface AudioManager extends AudioManagerState, AudioManagerActions {}

export function useAudioManager(): AudioManager {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const play = useCallback(async (song: Song): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setCurrentSong(song);
      audio.src = song.audio_url;

      if (audio.readyState === 0) {
        await new Promise((resolve, reject) => {
          const handleCanPlay = () => {
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("error", handleError);
            resolve(void 0);
          };

          const handleError = (_e: Event) => {
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("error", handleError);
            reject(new Error("Failed to load audio"));
          };

          audio.addEventListener("canplay", handleCanPlay);
          audio.addEventListener("error", handleError);

          audio.load();
        });
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (err) {
      console.error("Failed to play audio:", err);
      throw err;
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
  }, []);

  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (audio && currentSong) {
      try {
        if (!audio.src || audio.src !== currentSong.audio_url) {
          audio.src = currentSong.audio_url;
        }

        if (audio.readyState === 0) {
          await new Promise((resolve, reject) => {
            const handleCanPlay = () => {
              audio.removeEventListener("canplay", handleCanPlay);
              audio.removeEventListener("error", handleError);
              resolve(void 0);
            };

            const handleError = (_e: Event) => {
              audio.removeEventListener("canplay", handleCanPlay);
              audio.removeEventListener("error", handleError);
              reject(new Error("Failed to load audio"));
            };

            audio.addEventListener("canplay", handleCanPlay);
            audio.addEventListener("error", handleError);

            audio.load();
          });
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (err) {
        console.error("Failed to resume audio:", err);
        throw err;
      }
    }
  }, [currentSong]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      const clampedTime = Math.max(0, Math.min(time, audio.duration));
      audio.currentTime = clampedTime;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    const audio = audioRef.current;
    if (audio) {
      audio.volume = clampedVolume;
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setCurrentSong(null);
    }
  }, []);

  const setCurrentSongState = useCallback((song: Song | null) => {
    setCurrentSong(song);
  }, []);

  return {
    get isPlaying() {
      return audioRef.current ? !audioRef.current.paused : false;
    },
    get currentSong() {
      return currentSong;
    },
    get progress() {
      return audioRef.current ? audioRef.current.currentTime : 0;
    },
    get duration() {
      return audioRef.current ? audioRef.current.duration || 0 : 0;
    },
    get volume() {
      return audioRef.current ? audioRef.current.volume : 1;
    },
    get isLoading() {
      return audioRef.current ? audioRef.current.readyState < 3 : false;
    },
    get error() {
      return audioRef.current?.error ? "Audio error" : null;
    },
    play,
    pause,
    resume,
    seek,
    setVolume,
    stop,
    setCurrentSong: setCurrentSongState,
  };
}