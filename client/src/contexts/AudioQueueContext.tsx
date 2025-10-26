import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type {
  AudioState,
  AudioQueueContextType,
  QueueOperation,
  QueueItem,
  Song,
  RepeatMode,
} from "@types";
import { useAudioManager } from "@hooks";
import {
  createQueueItem,
  createQueueItems,
  getNextIndex,
  getPreviousIndex,
  getCurrentSong,
  filterPreservedItems,
  insertItemsAtPosition,
  saveAudioQueueState,
  loadAudioQueueState,
  createDebouncedSave,
  isLocalStorageAvailable,
  getStorageInfo,
  restoreQueueItems,
} from "@util";
import { songApi } from "@api";
import { AUDIO_QUEUE_STORAGE_KEYS } from "../constants/audioQueue.constants.js";

const AudioQueueContext = createContext<AudioQueueContextType | null>(null);

function audioQueueReducer(
  state: AudioState,
  action: QueueOperation
): AudioState {
  switch (action.type) {
    case "PLAY_SONG": {
      const newQueueItem = createQueueItem(action.song, false);
      return {
        ...state,
        queue: [newQueueItem],
        currentIndex: 0,
        currentSong: action.song,
        currentQueueId: newQueueItem.queueId,
        error: null,
      };
    }

    case "PLAY_LIST": {
      if (action.songs.length === 0) {
        return {
          ...state,
          queue: [],
          currentIndex: -1,
          currentSong: null,
          currentQueueId: null,
        };
      }

      const newQueueItems = createQueueItems(action.songs, false);
      return {
        ...state,
        queue: newQueueItems,
        currentIndex: 0,
        currentSong: action.songs[0],
        currentQueueId: newQueueItems[0].queueId,
        error: null,
      };
    }

    case "QUEUE_NEXT": {
      const newQueueItem = createQueueItem(action.song, true);

      if (state.queue.length === 0) {
        return {
          ...state,
          queue: [newQueueItem],
          currentIndex: 0,
          currentSong: action.song,
          currentQueueId: newQueueItem.queueId,
        };
      }

      const insertPosition = state.currentIndex + 1;
      const newQueue = insertItemsAtPosition(
        state.queue,
        [newQueueItem],
        insertPosition
      );

      return {
        ...state,
        queue: newQueue,
      };
    }

    case "QUEUE_LAST": {
      const newQueueItem = createQueueItem(action.song, true);

      if (state.queue.length === 0) {
        return {
          ...state,
          queue: [newQueueItem],
          currentIndex: 0,
          currentSong: action.song,
          currentQueueId: newQueueItem.queueId,
        };
      }

      return {
        ...state,
        queue: [...state.queue, newQueueItem],
      };
    }

    case "NEXT_SONG": {
      let nextIndex = getNextIndex(state.currentIndex, state.queue.length);

      if (
        nextIndex === null &&
        state.repeatMode === "all" &&
        state.queue.length > 0
      ) {
        nextIndex = 0;
      }

      if (nextIndex === null) {
        return state;
      }

      const nextSong = getCurrentSong(state.queue, nextIndex);
      const nextQueueItem = state.queue[nextIndex];

      return {
        ...state,
        currentIndex: nextIndex,
        currentSong: nextSong,
        currentQueueId: nextQueueItem?.queueId || null,
        progress: 0,
      };
    }

    case "PREVIOUS_SONG": {
      let prevIndex = getPreviousIndex(state.currentIndex);

      if (
        prevIndex === null &&
        state.repeatMode === "all" &&
        state.queue.length > 0
      ) {
        prevIndex = state.queue.length - 1;
      }

      if (prevIndex === null) {
        return state;
      }

      const prevSong = getCurrentSong(state.queue, prevIndex);
      const prevQueueItem = state.queue[prevIndex];

      return {
        ...state,
        currentIndex: prevIndex,
        currentSong: prevSong,
        currentQueueId: prevQueueItem?.queueId || null,
        progress: 0,
      };
    }

    case "CLEAR_QUEUE": {
      const preserveQueued = action.preserveQueued ?? true;

      if (!preserveQueued) {
        return {
          ...state,
          queue: [],
          currentIndex: -1,
          currentSong: null,
          currentQueueId: null,
          isPlaying: false,
          progress: 0,
        };
      }

      const preservedItems = filterPreservedItems(state.queue);

      if (preservedItems.length === 0) {
        return {
          ...state,
          queue: [],
          currentIndex: -1,
          currentSong: null,
          currentQueueId: null,
          isPlaying: false,
          progress: 0,
        };
      }

      const currentSong = state.currentSong;
      let newCurrentIndex = -1;
      let newCurrentSong = null;

      if (currentSong) {
        const currentItemIndex = preservedItems.findIndex(
          (item) => item.queueId === state.currentQueueId && item.isQueued
        );

        if (currentItemIndex !== -1) {
          newCurrentIndex = currentItemIndex;
          newCurrentSong = currentSong;
        } else if (preservedItems.length > 0) {
          newCurrentIndex = 0;
          newCurrentSong = preservedItems[0].song;
        }
      }

      return {
        ...state,
        queue: preservedItems,
        currentIndex: newCurrentIndex,
        currentSong: newCurrentSong,
        currentQueueId:
          newCurrentIndex >= 0 && preservedItems[newCurrentIndex]
            ? preservedItems[newCurrentIndex].queueId
            : null,
        isPlaying: newCurrentSong ? state.isPlaying : false,
        progress: newCurrentSong === currentSong ? state.progress : 0,
      };
    }

    case "REPLACE_QUEUE": {
      const preserveQueued = action.preserveQueued ?? true;
      let newQueue = [];

      if (preserveQueued) {
        const preservedItems = filterPreservedItems(state.queue);
        const newItems = createQueueItems(action.songs, false);
        newQueue = [...preservedItems, ...newItems];
      } else {
        newQueue = createQueueItems(action.songs, false);
      }

      if (newQueue.length === 0) {
        return {
          ...state,
          queue: [],
          currentIndex: -1,
          currentSong: null,
          isPlaying: false,
          progress: 0,
        };
      }

      let newCurrentIndex = 0;
      let newCurrentSong = newQueue[0].song;

      if (preserveQueued && state.currentSong) {
        const currentSongIndex = newQueue.findIndex(
          (item) => item.queueId === state.currentQueueId
        );

        if (currentSongIndex !== -1) {
          newCurrentIndex = currentSongIndex;
          newCurrentSong = state.currentSong;
        }
      }

      return {
        ...state,
        queue: newQueue,
        currentIndex: newCurrentIndex,
        currentSong: newCurrentSong,
        currentQueueId:
          newCurrentIndex >= 0 && newQueue[newCurrentIndex]
            ? newQueue[newCurrentIndex].queueId
            : null,
        progress: newCurrentSong === state.currentSong ? state.progress : 0,
      };
    }

    case "REMOVE_ITEM": {
      const newQueue = state.queue.filter(
        (item) => item.queueId !== action.itemId
      );

      if (newQueue.length === 0) {
        return {
          ...state,
          queue: [],
          currentIndex: -1,
          currentSong: null,
          currentQueueId: null,
          isPlaying: false,
          progress: 0,
        };
      }

      const removedIndex = state.queue.findIndex(
        (item) => item.queueId === action.itemId
      );

      if (removedIndex === -1) {
        return state;
      }

      let newCurrentIndex = state.currentIndex;
      let newCurrentSong = state.currentSong;

      if (removedIndex === state.currentIndex) {
        if (newCurrentIndex >= newQueue.length) {
          newCurrentIndex = newQueue.length - 1;
        }
        newCurrentSong = newQueue[newCurrentIndex]?.song || null;
      } else if (removedIndex < state.currentIndex) {
        newCurrentIndex = state.currentIndex - 1;
      }

      return {
        ...state,
        queue: newQueue,
        currentIndex: newCurrentIndex,
        currentSong: newCurrentSong,
        progress: newCurrentSong === state.currentSong ? state.progress : 0,
      };
    }

    case "SHUFFLE_QUEUE": {
      if (state.queue.length <= 1) {
        return state;
      }

      const currentItem = state.queue[state.currentIndex];
      const otherItems = state.queue.filter(
        (_, index) => index !== state.currentIndex
      );

      const shuffledOthers = [...otherItems];
      for (let i = shuffledOthers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOthers[i], shuffledOthers[j]] = [
          shuffledOthers[j],
          shuffledOthers[i],
        ];
      }

      const shuffledQueue = currentItem
        ? [currentItem, ...shuffledOthers]
        : shuffledOthers;

      return {
        ...state,
        queue: shuffledQueue,
        currentIndex: currentItem ? 0 : -1,
      };
    }

    case "MOVE_QUEUE_ITEM": {
      const { fromIndex, toIndex } = action;

      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        fromIndex >= state.queue.length ||
        toIndex < 0 ||
        toIndex >= state.queue.length
      ) {
        return state;
      }

      const newQueue = [...state.queue];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);

      let newCurrentIndex = state.currentIndex;
      if (fromIndex === state.currentIndex) {
        newCurrentIndex = toIndex;
      } else if (
        fromIndex < state.currentIndex &&
        toIndex >= state.currentIndex
      ) {
        newCurrentIndex = state.currentIndex - 1;
      } else if (
        fromIndex > state.currentIndex &&
        toIndex <= state.currentIndex
      ) {
        newCurrentIndex = state.currentIndex + 1;
      }

      return {
        ...state,
        queue: newQueue,
        currentIndex: newCurrentIndex,
      };
    }

    case "SET_PLAYING":
      return { ...state, isPlaying: action.isPlaying };

    case "SET_PROGRESS":
      return { ...state, progress: action.progress };

    case "SET_DURATION":
      return { ...state, duration: action.duration };

    case "SET_VOLUME":
      return { ...state, volume: action.volume };

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "SET_REPEAT_MODE":
      return { ...state, repeatMode: action.repeatMode };

    case "SET_CURRENT_SONG_AND_INDEX":
      return {
        ...state,
        currentSong: action.song,
        currentQueueId: action.queueId,
        currentIndex: action.index,
        progress: 0,
      };

    case "RESTORE_STATE":
      return {
        ...state,
        queue: action.queue,
        currentIndex: action.currentIndex,
        currentSong: action.currentSong,
        currentQueueId:
          action.currentIndex >= 0 && action.queue[action.currentIndex]
            ? action.queue[action.currentIndex].queueId
            : null,
        progress: 0,
        volume: action.volume,
        isPlaying: false,
        error: null,
      };

    default:
      return state;
  }
}

interface AudioQueueProviderProps {
  children: ReactNode;
}

export function AudioQueueProvider({ children }: AudioQueueProviderProps) {
  const initialState: AudioState = {
    isPlaying: false,
    currentSong: null,
    currentQueueId: null,
    currentIndex: -1,
    queue: [],
    progress: 0,
    duration: 0,
    volume: 1,
    isLoading: false,
    error: null,
    repeatMode: "none",
  };

  const [state, dispatch] = useReducer(audioQueueReducer, initialState);
  const audioManager = useAudioManager();

  const debouncedSave = useRef(createDebouncedSave(1000));

  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    const restoreQueue = async () => {
      const persistedState = loadAudioQueueState();
      if (!persistedState) return;

      if (persistedState.volume !== undefined) {
        audioManager.setVolume(persistedState.volume);
      }

      if (persistedState.queue.length > 0) {
        try {
          const restoredItems: QueueItem[] = [];

          for (const persistedItem of persistedState.queue) {
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
              console.warn(
                `Failed to fetch song ${persistedItem.songId}:`,
                error
              );
            }
          }

          if (restoredItems.length > 0) {
            let currentSong: Song | null = null;
            let currentIndex = -1;

            if (persistedState.currentSongId) {
              const currentSongIndex = restoredItems.findIndex(
                (item) => item.song.id === persistedState.currentSongId
              );

              if (currentSongIndex !== -1) {
                currentSong = restoredItems[currentSongIndex].song;
                currentIndex = currentSongIndex;
              }
            }

            dispatch({
              type: "RESTORE_STATE",
              queue: restoredItems,
              currentIndex: currentIndex,
              currentSong: currentSong,
              volume: persistedState.volume,
            });
          } else {
            console.log("No songs could be restored from persisted state");
          }
        } catch (error) {
          console.error("Failed to restore queue from API:", error);
        }
      }
    };

    restoreQueue();
  }, []);

  useEffect(() => {
    if (isLocalStorageAvailable()) {
      if (state.queue.length > 0 || state.currentSong || state.volume !== 1) {
        try {
          debouncedSave.current(state);
        } catch (error) {
          console.error("Failed to auto-save audio queue state:", error);
          try {
            localStorage.removeItem(AUDIO_QUEUE_STORAGE_KEYS.STATE);
          } catch (clearError) {
            console.error("Failed to clear corrupted state:", clearError);
          }
        }
      }
    }
  }, [state.queue, state.currentIndex, state.currentSong, state.volume]);

  useEffect(() => {
    if (!state.isPlaying || !state.currentSong) return;

    const interval = setInterval(() => {
      const progress = audioManager.progress;
      const duration = audioManager.duration;
      const isPlaying = audioManager.isPlaying;

      dispatch({ type: "SET_PROGRESS", progress });
      dispatch({ type: "SET_DURATION", duration });
      dispatch({ type: "SET_LOADING", isLoading: audioManager.isLoading });
      dispatch({ type: "SET_ERROR", error: audioManager.error });

      if (duration > 0 && progress >= duration - 0.5 && !isPlaying) {
        if (state.repeatMode === "one") {
          if (state.currentSong) {
            audioManager.play(state.currentSong);
          }
        } else if (state.repeatMode === "all") {
          const nextIndex = getNextIndex(
            state.currentIndex,
            state.queue.length
          );
          if (nextIndex !== null && state.queue[nextIndex]) {
            dispatch({ type: "NEXT_SONG" });
            audioManager.play(state.queue[nextIndex].song);
          } else if (state.queue.length > 0) {
            dispatch({
              type: "SET_CURRENT_SONG_AND_INDEX",
              song: state.queue[0].song,
              queueId: state.queue[0].queueId,
              index: 0,
            });
            audioManager.play(state.queue[0].song);
          }
        } else {
          const nextIndex = getNextIndex(
            state.currentIndex,
            state.queue.length
          );
          if (nextIndex !== null && state.queue[nextIndex]) {
            dispatch({ type: "NEXT_SONG" });
            audioManager.play(state.queue[nextIndex].song);
          } else {
            dispatch({ type: "SET_PLAYING", isPlaying: false });
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    state.isPlaying,
    state.currentSong,
    state.repeatMode,
    state.currentIndex,
    state.queue.length,
  ]);

  const actions = {
    play: async (songOrList: Song | Song[]) => {
      if (Array.isArray(songOrList)) {
        dispatch({ type: "PLAY_LIST", songs: songOrList });
        if (songOrList.length > 0) {
          await audioManager.play(songOrList[0]);
          dispatch({ type: "SET_PLAYING", isPlaying: true });
        }
      } else {
        dispatch({ type: "PLAY_SONG", song: songOrList });
        await audioManager.play(songOrList);
        dispatch({ type: "SET_PLAYING", isPlaying: true });
      }
    },

    pause: () => {
      audioManager.pause();
      dispatch({ type: "SET_PLAYING", isPlaying: false });
    },

    resume: async () => {
      if (state.currentSong) {
        await audioManager.play(state.currentSong);
        dispatch({ type: "SET_PLAYING", isPlaying: true });
      }
    },

    next: async () => {
      const nextIndex = getNextIndex(state.currentIndex, state.queue.length);
      if (nextIndex !== null && state.queue[nextIndex]) {
        dispatch({ type: "NEXT_SONG" });
        await audioManager.play(state.queue[nextIndex].song);
        dispatch({ type: "SET_PLAYING", isPlaying: true });
      }
    },

    previous: async () => {
      const prevIndex = getPreviousIndex(state.currentIndex);
      if (prevIndex !== null && state.queue[prevIndex]) {
        dispatch({ type: "PREVIOUS_SONG" });
        await audioManager.play(state.queue[prevIndex].song);
        dispatch({ type: "SET_PLAYING", isPlaying: true });
      }
    },

    seek: (time: number) => {
      audioManager.seek(time);
      dispatch({ type: "SET_PROGRESS", progress: time });
    },

    setVolume: (volume: number) => {
      audioManager.setVolume(volume);
      dispatch({ type: "SET_VOLUME", volume });
    },

    queueNext: (song: Song) => {
      if (!song || !song.id) {
        console.warn("Invalid song provided to queueNext");
        return;
      }
      dispatch({ type: "QUEUE_NEXT", song });
    },

    queueLast: (song: Song) => {
      if (!song || !song.id) {
        console.warn("Invalid song provided to queueLast");
        return;
      }
      dispatch({ type: "QUEUE_LAST", song });
    },

    clearQueue: (preserveQueued?: boolean) => {
      dispatch({ type: "CLEAR_QUEUE", preserveQueued });
    },

    replaceQueue: (songs: Song[], preserveQueued?: boolean) => {
      if (!Array.isArray(songs)) {
        console.warn("Invalid songs array provided to replaceQueue");
        return;
      }
      const validSongs = songs.filter(
        (song) => song && song.id && song.audio_url
      );
      dispatch({ type: "REPLACE_QUEUE", songs: validSongs, preserveQueued });
    },

    stop: () => {
      audioManager.stop();
      dispatch({ type: "SET_PLAYING", isPlaying: false });
      dispatch({ type: "CLEAR_QUEUE", preserveQueued: false });
    },

    removeFromQueue: (itemId: string) => {
      if (!itemId) {
        console.warn("Invalid itemId provided to removeFromQueue");
        return;
      }
      dispatch({ type: "REMOVE_ITEM", itemId });
    },

    shuffleQueue: () => {
      dispatch({ type: "SHUFFLE_QUEUE" });
    },

    moveQueueItem: (fromIndex: number, toIndex: number) => {
      if (fromIndex < 0 || toIndex < 0) {
        console.warn("Invalid indices provided to moveQueueItem");
        return;
      }
      dispatch({ type: "MOVE_QUEUE_ITEM", fromIndex, toIndex });
    },

    setRepeatMode: (mode: RepeatMode) => {
      dispatch({ type: "SET_REPEAT_MODE", repeatMode: mode });
    },

    toggleRepeatMode: () => {
      const nextMode: RepeatMode =
        state.repeatMode === "none"
          ? "one"
          : state.repeatMode === "one"
          ? "all"
          : "none";
      dispatch({ type: "SET_REPEAT_MODE", repeatMode: nextMode });
    },

    saveState: () => {
      if (isLocalStorageAvailable()) {
        saveAudioQueueState(state);
      }
    },

    clearPersistedState: () => {
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(AUDIO_QUEUE_STORAGE_KEYS.STATE);
      }
    },

    restoreState: async () => {
      if (!isLocalStorageAvailable()) {
        console.warn("localStorage not available, cannot restore state");
        return false;
      }

      const persistedState = loadAudioQueueState();
      if (!persistedState || persistedState.queue.length === 0) {
        console.log("No persisted state to restore");
        return false;
      }

      try {
        const restoredItems: QueueItem[] = await restoreQueueItems(
          persistedState.queue
        );

        if (restoredItems.length === 0) {
          return false;
        }

        let currentSong: Song | null = null;
        let currentIndex = -1;

        if (persistedState.currentSongId) {
          const currentSongIndex = restoredItems.findIndex(
            (item) => item.song.id === persistedState.currentSongId
          );

          if (currentSongIndex !== -1) {
            currentSong = restoredItems[currentSongIndex].song;
            currentIndex = currentSongIndex;
          }
        }

        dispatch({
          type: "RESTORE_STATE",
          queue: restoredItems,
          currentIndex: currentIndex,
          currentSong: currentSong,
          volume: persistedState.volume,
        });
        return true;
      } catch (error) {
        console.error("Failed to restore state with songs:", error);
        return false;
      }
    },

    getStorageInfo: () => {
      return getStorageInfo();
    },
  };

  const contextValue: AudioQueueContextType = {
    state: {
      ...state,
      hasNextSong:
        getNextIndex(state.currentIndex, state.queue.length) !== null,
      hasPreviousSong: getPreviousIndex(state.currentIndex) !== null,
    },
    actions,
  };

  return (
    <AudioQueueContext.Provider value={contextValue}>
      {children}
    </AudioQueueContext.Provider>
  );
}

export function useAudioQueue(): AudioQueueContextType {
  const context = useContext(AudioQueueContext);

  if (!context) {
    throw new Error("useAudioQueue must be used within an AudioQueueProvider");
  }

  return context;
}
