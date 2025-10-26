import type { AudioState, PersistedAudioState, QueueItem } from "@types";
import { AUDIO_QUEUE_STORAGE_KEYS, QUEUE_CONSTRAINTS } from "@constants";
import { songApi } from "@api";

/**
 * Save audio queue state to localStorage
 * @param state The current audio state to persist
 */
export function saveAudioQueueState(state: AudioState): void {
  try {
    const persistedState: PersistedAudioState = {
      currentSongId: state.currentSong?.id || null,
      currentIndex: state.currentIndex,
      queue: state.queue.map((item) => ({
        songId: item.song.id,
        isQueued: item.isQueued,
      })),
      volume: state.volume,
      timestamp: Date.now(),
    };

    localStorage.setItem(
      AUDIO_QUEUE_STORAGE_KEYS.STATE,
      JSON.stringify(persistedState)
    );
  } catch (error) {
    console.warn("Failed to save audio queue state:", error);
  }
}

/**
 * Load audio queue state from localStorage
 * @returns The persisted audio state or null if not found/invalid
 */
export function loadAudioQueueState(): PersistedAudioState | null {
  try {
    const saved = localStorage.getItem(AUDIO_QUEUE_STORAGE_KEYS.STATE);
    if (!saved) return null;

    const parsed: PersistedAudioState = JSON.parse(saved);

    if (!isValidPersistedState(parsed)) {
      console.warn("Invalid persisted state structure, clearing");
      clearAudioQueueState();
      return null;
    }

    const age = Date.now() - parsed.timestamp;
    if (age > QUEUE_CONSTRAINTS.CACHE_EXPIRATION_MS) {
      console.log("Persisted state expired, clearing");
      clearAudioQueueState();
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to load audio queue state:", error);
    clearAudioQueueState();
    return null;
  }
}

/**
 * Clear persisted audio queue state
 */
export function clearAudioQueueState(): void {
  try {
    localStorage.removeItem(AUDIO_QUEUE_STORAGE_KEYS.STATE);
  } catch (error) {
    console.warn("Failed to clear audio queue state:", error);
  }
}

/**
 * Validate persisted state structure
 * @param state The state to validate
 */
function isValidPersistedState(state: any): state is PersistedAudioState {
  return (
    state &&
    typeof state === "object" &&
    (state.currentSongId === null || typeof state.currentSongId === "string") &&
    typeof state.currentIndex === "number" &&
    Array.isArray(state.queue) &&
    typeof state.volume === "number" &&
    typeof state.timestamp === "number" &&
    state.queue.every(
      (item: any) =>
        item &&
        typeof item.songId === "string" &&
        typeof item.isQueued === "boolean"
    )
  );
}

/**
 * Restore queue items from persisted state using the song API
 * @param persistedQueue The persisted queue items
 * @returns The restored queue items
 */
export async function restoreQueueItems(
  persistedQueue: PersistedAudioState["queue"]
): Promise<QueueItem[]> {
  const restoredItems: QueueItem[] = [];

  try {
    for (const persistedItem of persistedQueue) {
      try {
        const song = await songApi.getSongById(persistedItem.songId);
        if (song) {
          restoredItems.push({
            song,
            isQueued: persistedItem.isQueued,
            queueId: `restored_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 11)}`,
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch song ${persistedItem.songId}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to restore queue:", error);
  }

  return restoredItems;
}

/**
 * Create a debounced save function to avoid excessive localStorage writes
 * @param delay The debounce delay in milliseconds
 * @returns The debounced save function
 */
export function createDebouncedSave(delay: number = 1000) {
  let timeoutId: NodeJS.Timeout | null = null;

  return (state: AudioState) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      saveAudioQueueState(state);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Check if localStorage is available
 * @returns True if available, false otherwise
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage usage information
 * @returns Storage info object
 */
export function getStorageInfo(): {
  isAvailable: boolean;
  hasPersistedState: boolean;
  stateSize: number;
  lastSaved: Date | null;
} {
  const isAvailable = isLocalStorageAvailable();

  if (!isAvailable) {
    return {
      isAvailable: false,
      hasPersistedState: false,
      stateSize: 0,
      lastSaved: null,
    };
  }

  try {
    const saved = localStorage.getItem(AUDIO_QUEUE_STORAGE_KEYS.STATE);
    const hasPersistedState = !!saved;
    const stateSize = saved ? saved.length : 0;

    let lastSaved: Date | null = null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.timestamp) {
        lastSaved = new Date(parsed.timestamp);
      }
    }

    return {
      isAvailable: true,
      hasPersistedState,
      stateSize,
      lastSaved,
    };
  } catch (error) {
    console.warn("Failed to get storage info:", error);
    return {
      isAvailable: true,
      hasPersistedState: false,
      stateSize: 0,
      lastSaved: null,
    };
  }
}
