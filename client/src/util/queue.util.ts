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
 * @returns The created QueueItem
 */
export function createQueueItem(
  song: Song,
  isQueued: boolean = false
): QueueItem {
  return {
    song,
    isQueued,
    queueId: generateQueueItemId(),
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
  return songs.map((song) => createQueueItem(song, isQueued));
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
