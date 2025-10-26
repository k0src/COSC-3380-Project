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
 * Find a queue item by song ID
 * @param queue The queue to search
 * @param songId The song ID to find
 * @returns The found QueueItem or undefined
 */
export function findQueueItemBySongId(
  queue: QueueItem[],
  songId: string
): QueueItem | undefined {
  return queue.find((item) => item.song.id === songId);
}

/**
 * Find the index of a queue item by song ID
 * @param queue The queue to search
 * @param songId The song ID to find
 * @returns The index of the found QueueItem or -1 if not found
 */
export function findQueueIndexBySongId(
  queue: QueueItem[],
  songId: string
): number {
  return queue.findIndex((item) => item.song.id === songId);
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
 * Remove a queue item by its ID
 * @param queue The current queue
 * @param itemId The ID of the item to remove
 * @returns The new queue with the item removed
 */
export function removeItemById(
  queue: QueueItem[],
  itemId: string
): QueueItem[] {
  return queue.filter((item) => item.queueId !== itemId);
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
 * Check if there is a next song available
 * @param currentIndex The current index
 * @param queueLength The length of the queue
 * @returns True if there is a next song, false otherwise
 */
export function hasNextSong(
  currentIndex: number,
  queueLength: number
): boolean {
  return getNextIndex(currentIndex, queueLength) !== null;
}

/**
 * Check if there is a previous song available
 * @param currentIndex The current index
 * @returns True if there is a previous song, false otherwise
 */
export function hasPreviousSong(currentIndex: number): boolean {
  return getPreviousIndex(currentIndex) !== null;
}

/**
 * Validate if an index is within the bounds of the queue
 * @param index The index to validate
 * @param queueLength The length of the queue
 * @returns True if valid, false otherwise
 */
export function isValidQueueIndex(index: number, queueLength: number): boolean {
  return index >= 0 && index < queueLength;
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
  if (!isValidQueueIndex(currentIndex, queue.length)) {
    return null;
  }
  return queue[currentIndex]?.song || null;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param array The array to shuffle
 * @returns The shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create a shuffled queue while keeping the current song at the front
 * @param queue The current queue
 * @param currentIndex The current index
 * @returns The shuffled queue and new current index
 */
export function createShuffledQueue(
  queue: QueueItem[],
  currentIndex: number
): { shuffledQueue: QueueItem[]; newCurrentIndex: number } {
  if (queue.length <= 1) {
    return { shuffledQueue: [...queue], newCurrentIndex: currentIndex };
  }

  const currentItem = queue[currentIndex];
  const otherItems = queue.filter((_, index) => index !== currentIndex);
  const shuffledOthers = shuffleArray(otherItems);

  // Put current song first, then shuffled others
  const shuffledQueue = currentItem
    ? [currentItem, ...shuffledOthers]
    : shuffledOthers;

  return {
    shuffledQueue,
    newCurrentIndex: currentItem ? 0 : -1,
  };
}
