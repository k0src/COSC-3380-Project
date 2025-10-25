/**
 * Storage keys for persistent audio queue state
 */
export const AUDIO_QUEUE_STORAGE_KEYS = {
  STATE: "audioQueue_state",
  VOLUME: "audioQueue_volume",
  CURRENT_SONG: "audioQueue_currentSong",
  QUEUE: "audioQueue_queue",
  CURRENT_INDEX: "audioQueue_currentIndex",
  PROGRESS: "audioQueue_progress",
} as const;

/**
 * Default values for audio queue state
 */
export const DEFAULT_AUDIO_STATE = {
  isPlaying: false,
  currentSong: null,
  currentIndex: -1,
  queue: [],
  progress: 0,
  duration: 0,
  volume: 1,
  isLoading: false,
  error: null,
} as const;

/**
 * Queue operation limits and constraints
 */
export const QUEUE_CONSTRAINTS = {
  MAX_QUEUE_SIZE: 1000,
  MAX_QUEUED_SONGS: 50,
  CACHE_EXPIRATION_MS: 24 * 60 * 60 * 1000,
} as const;

/**
 * Audio playback constants
 */
export const AUDIO_CONSTANTS = {
  PROGRESS_UPDATE_INTERVAL: 1000,
  VOLUME_STEP: 0.1,
  SEEK_STEP: 10,
} as const;
