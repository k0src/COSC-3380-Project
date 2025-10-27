import type { Song } from "@types";

/**
 * Queue item that wraps a Song with queueing metadata
 */
export interface QueueItem {
  song: Song;
  isQueued: boolean;
  queueId: string;
  originalIndex?: number;
  queueType?: "next" | "last";
  relativePosition?: number; // Position relative to current song when queued
}

/**
 * Global audio state for the AudioQueue context
 */
export type RepeatMode = "none" | "one" | "all";

export interface AudioState {
  isPlaying: boolean;
  currentSong: Song | null;
  currentQueueId: string | null;
  currentIndex: number;
  queue: QueueItem[];
  progress: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  hasNextSong?: boolean;
  hasPreviousSong?: boolean;
}

/**
 * AudioQueue actions
 */
export interface AudioQueueActions {
  play: (songs: Song | Song[]) => Promise<void>;
  pause: () => void;
  resume: () => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  queueNext: (song: Song) => void;
  queueLast: (song: Song) => void;
  clearQueue: (preserveQueued?: boolean) => void;
  replaceQueue: (songs: Song[], preserveQueued?: boolean) => void;
  stop: () => void;
  removeFromQueue: (itemId: string) => void;
  toggleShuffleQueue: () => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleRepeatMode: () => void;
  saveState: () => void;
  clearPersistedState: () => void;
  restoreState: () => Promise<boolean>;
}

/**
 * AudioQueue context type
 */
export interface AudioQueueContextType {
  state: AudioState;
  actions: AudioQueueActions;
}

/**
 * Persistent state for localStorage
 */
export interface PersistedAudioState {
  currentSongId: string | null;
  currentIndex: number;
  queue: {
    songId: string;
    isQueued: boolean;
  }[];
  volume: number;
  timestamp: number;
}

/**
 * Queue operation types
 */
export type QueueOperation =
  | { type: "PLAY_SONG"; song: Song }
  | { type: "PLAY_LIST"; songs: Song[] }
  | { type: "QUEUE_NEXT"; song: Song }
  | { type: "QUEUE_LAST"; song: Song }
  | { type: "CLEAR_QUEUE"; preserveQueued?: boolean }
  | { type: "REPLACE_QUEUE"; songs: Song[]; preserveQueued?: boolean }
  | { type: "NEXT_SONG" }
  | { type: "PREVIOUS_SONG" }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "TOGGLE_SHUFFLE_QUEUE" }
  | { type: "MOVE_QUEUE_ITEM"; fromIndex: number; toIndex: number }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "SET_PROGRESS"; progress: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_REPEAT_MODE"; repeatMode: RepeatMode }
  | {
      type: "SET_CURRENT_SONG_AND_INDEX";
      song: Song;
      queueId: string;
      index: number;
    }
  | {
      type: "RESTORE_STATE";
      queue: QueueItem[];
      currentIndex: number;
      currentSong: Song | null;
      volume: number;
    };