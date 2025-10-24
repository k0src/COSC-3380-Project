import { useState, useRef, useCallback, useEffect } from "react";
import type { Song } from "@types";

export interface AudioManagerState {
  isPlaying: boolean;
  currentSong: Song | null;
  progress: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
}

export interface AudioManagerActions {
  play: (song: Song) => Promise<void>;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  stop: () => void;
}

export interface AudioManager extends AudioManagerState, AudioManagerActions {}

const STORAGE_KEYS = {
  VOLUME: "audioManager_volume",
  CURRENT_SONG: "audioManager_currentSong",
  PROGRESS: "audioManager_progress",
} as const;

export function useAudioManager(): AudioManager {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return saved ? parseFloat(saved) : 1;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volume;

    audioRef.current = audio;

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused && audio.duration) {
        const newProgress = audio.currentTime;
        setProgress(newProgress);

        // Save progress to localStorage
        if (currentSong) {
          localStorage.setItem(STORAGE_KEYS.PROGRESS, newProgress.toString());
        }
      }
    }, 1000);
  }, [currentSong]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Audio event handlers
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
      setIsLoading(false);
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    startProgressTracking();
  }, [startProgressTracking]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    stopProgressTracking();
    setProgress(0);
  }, [stopProgressTracking]);

  const handleError = useCallback(
    (event: Event) => {
      const audio = event.target as HTMLAudioElement;
      setIsLoading(false);
      setIsPlaying(false);
      stopProgressTracking();

      let errorMessage = "Failed to load audio";
      if (audio.error) {
        switch (audio.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Audio loading was aborted";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Network error occurred while loading audio";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Audio file is corrupted or unsupported";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Audio format not supported";
            break;
        }
      }
      setError(errorMessage);
    },
    [stopProgressTracking]
  );

  // Event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [
    handleLoadStart,
    handleLoadedMetadata,
    handleCanPlay,
    handlePlay,
    handlePause,
    handleEnded,
    handleError,
  ]);

  // Actions
  const play = useCallback(
    async (song: Song): Promise<void> => {
      const audio = audioRef.current;
      if (!audio) return;

      try {
        setError(null);

        if (!currentSong || currentSong.id !== song.id) {
          setCurrentSong(song);
          audio.src = song.audio_url;

          // Save current song to localStorage
          localStorage.setItem(STORAGE_KEYS.CURRENT_SONG, JSON.stringify(song));
          setProgress(0);
          localStorage.removeItem(STORAGE_KEYS.PROGRESS);
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to play audio";
        setError(errorMessage);
        setIsPlaying(false);
      }
    },
    [currentSong]
  );

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
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to resume audio";
        setError(errorMessage);
      }
    }
  }, [currentSong]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (audio && audio.duration) {
        const clampedTime = Math.max(0, Math.min(time, audio.duration));
        audio.currentTime = clampedTime;
        setProgress(clampedTime);

        // Save progress to localStorage
        if (currentSong) {
          localStorage.setItem(STORAGE_KEYS.PROGRESS, clampedTime.toString());
        }
      }
    },
    [currentSong]
  );

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);

    const audio = audioRef.current;
    if (audio) {
      audio.volume = clampedVolume;
    }

    // Save volume to localStorage
    localStorage.setItem(STORAGE_KEYS.VOLUME, clampedVolume.toString());
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setProgress(0);
      setCurrentSong(null);

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SONG);
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    }
  }, []);

  // Restore state on mount
  useEffect(() => {
    const savedSong = localStorage.getItem(STORAGE_KEYS.CURRENT_SONG);
    const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);

    if (savedSong) {
      try {
        const song: Song = JSON.parse(savedSong);
        setCurrentSong(song);

        const audio = audioRef.current;
        if (audio) {
          audio.src = song.audio_url;

          if (savedProgress) {
            const progressTime = parseFloat(savedProgress);
            audio.currentTime = progressTime;
            setProgress(progressTime);
          }
        }
      } catch (err) {
        console.warn("Failed to restore audio state:", err);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SONG);
        localStorage.removeItem(STORAGE_KEYS.PROGRESS);
      }
    }
  }, []);

  return {
    // State
    isPlaying,
    currentSong,
    progress,
    duration,
    volume,
    isLoading,
    error,
    // Actions
    play,
    pause,
    resume,
    seek,
    setVolume,
    stop,
  };
}
