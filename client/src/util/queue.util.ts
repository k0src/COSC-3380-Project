import { v7 } from "uuid";
import type { QueueItem, Song } from "@types";

/**
 * Generate a unique ID for a queue item
 * @returns Unique queue item ID
 */
export function generateQueueItemId(): string {
  return `queue_${v7()}`;
}

/**
 * Create a QueueItem from a Song
 * @param song The song to create a queue item for
 * @param isQueued Whether the item is queued by the user
 * @param originalIndex Optional original index for shuffle/unshuffle functionality
 * @param queueType Optional queue type (next or last)
 * @param relativePosition Optional relative position to current song
 * @returns The created QueueItem
 */
export function createQueueItem(
  song: Song,
  isQueued: boolean = false,
  originalIndex?: number,
  queueType?: "next" | "last",
  relativePosition?: number
): QueueItem {
  return {
    song,
    isQueued,
    queueId: generateQueueItemId(),
    originalIndex,
    queueType,
    relativePosition,
  };
}

/**
 * Create multiple QueueItems from an array of Songs
 * @param songs The songs to create queue items for
 * @param isQueued Whether the items are queued by the user
 * @returns Array of created QueueItems
 */
export function createQueueItems(
  songs: Song[],
  isQueued: boolean = false
): QueueItem[] {
  return songs.map((song, index) => createQueueItem(song, isQueued, index));
}

/**
 * Filter queue to only preserved (user-queued) items
 * @param queue The full queue
 * @returns Array of preserved QueueItems
 */
export function filterPreservedItems(queue: QueueItem[]): QueueItem[] {
  return queue.filter((item) => item.isQueued);
}

/**
 * Insert items into the queue at a specific position
 * @param queue The current queue
 * @param items The items to insert
 * @param position The position to insert at
 * @returns The new queue with items inserted
 */
export function insertItemsAtPosition(
  queue: QueueItem[],
  items: QueueItem[],
  position: number
): QueueItem[] {
  const newQueue = [...queue];
  newQueue.splice(position, 0, ...items);
  return newQueue;
}

/**
 * Get the next valid index in the queue (with bounds checking)
 * @param currentIndex The current index
 * @param queueLength The length of the queue
 * @returns The next index or null if at the end
 */
export function getNextIndex(
  currentIndex: number,
  queueLength: number
): number | null {
  if (queueLength === 0) return null;
  const nextIndex = currentIndex + 1;
  return nextIndex < queueLength ? nextIndex : null;
}

/**
 * Get the previous valid index in the queue (with bounds checking)
 * @param currentIndex The current index
 * @returns The previous index or null if at the start
 */
export function getPreviousIndex(currentIndex: number): number | null {
  const prevIndex = currentIndex - 1;
  return prevIndex >= 0 ? prevIndex : null;
}

/**
 * Get the current song from the queue based on the current index
 * @param queue The current queue
 * @param currentIndex The current index
 * @returns The current Song or null if index is invalid
 */
export function getCurrentSong(
  queue: QueueItem[],
  currentIndex: number
): Song | null {
  if (currentIndex < 0 || currentIndex >= queue.length) {
    return null;
  }
  return queue[currentIndex]?.song || null;
}
/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param array The array to shuffle
 * @returns A new shuffled array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Toggle shuffle state of the queue
 * @param queue The current queue
 * @param currentIndex The current index
 * @param isCurrentlyShuffled Whether the queue is currently shuffled
 * @returns Object with new queue, new current index, and new shuffle state
 */
export function toggleQueueShuffle(
  queue: QueueItem[],
  currentIndex: number,
  isCurrentlyShuffled: boolean
): {
  newQueue: QueueItem[];
  newCurrentIndex: number;
  newShuffleState: boolean;
} {
  if (queue.length <= 1) {
    return {
      newQueue: queue,
      newCurrentIndex: currentIndex,
      newShuffleState: isCurrentlyShuffled,
    };
  }

  if (isCurrentlyShuffled) {
    const unshuffledQueue = [...queue].sort((a, b) => {
      if (a.isQueued || b.isQueued) return 0;

      const aIndex = a.originalIndex ?? Number.MAX_SAFE_INTEGER;
      const bIndex = b.originalIndex ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });

    const currentItem = queue[currentIndex];
    const newCurrentIndex = currentItem
      ? unshuffledQueue.findIndex(
          (item) => item.queueId === currentItem.queueId
        )
      : -1;

    return {
      newQueue: unshuffledQueue,
      newCurrentIndex: newCurrentIndex >= 0 ? newCurrentIndex : 0,
      newShuffleState: false,
    };
  } else {
    const currentItem = queue[currentIndex];
    const otherItems = queue.filter((_, index) => index !== currentIndex);

    const userQueued = otherItems.filter((item) => item.isQueued);
    const nonUserQueued = otherItems.filter((item) => !item.isQueued);

    const shuffledNonUserQueued = shuffleArray(nonUserQueued);
    const shuffledQueue: QueueItem[] = [];

    if (currentItem) {
      shuffledQueue.push(currentItem);
    }

    const queuedNext = userQueued.filter((item) => item.queueType === "next");
    queuedNext.sort(
      (a, b) => (a.relativePosition || 0) - (b.relativePosition || 0)
    );
    shuffledQueue.push(...queuedNext);
    shuffledQueue.push(...shuffledNonUserQueued);
    const queuedLast = userQueued.filter((item) => item.queueType === "last");
    shuffledQueue.push(...queuedLast);

    return {
      newQueue: shuffledQueue,
      newCurrentIndex: 0,
      newShuffleState: true,
    };
  }
}
