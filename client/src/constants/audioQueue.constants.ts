/**
 * Storage keys for persistent audio queue state
 */
export const AUDIO_QUEUE_STORAGE_KEYS = {
  STATE: "audioQueue_state",
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
  PREVIOUS_SONG_THRESHOLD: 3,
} as const;
