import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type {
  AudioState,
  AudioQueueContextType,
  QueueOperation,
  Song,
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
} from "@util";

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
        };
      }

      const newQueueItems = createQueueItems(action.songs, false);
      return {
        ...state,
        queue: newQueueItems,
        currentIndex: 0,
        currentSong: action.songs[0],
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
        };
      }

      return {
        ...state,
        queue: [...state.queue, newQueueItem],
      };
    }

    case "NEXT_SONG": {
      const nextIndex = getNextIndex(state.currentIndex, state.queue.length);

      if (nextIndex === null) {
        return state;
      }

      const nextSong = getCurrentSong(state.queue, nextIndex);

      return {
        ...state,
        currentIndex: nextIndex,
        currentSong: nextSong,
        progress: 0,
      };
    }

    case "PREVIOUS_SONG": {
      const prevIndex = getPreviousIndex(state.currentIndex);

      if (prevIndex === null) {
        return state;
      }

      const prevSong = getCurrentSong(state.queue, prevIndex);

      return {
        ...state,
        currentIndex: prevIndex,
        currentSong: prevSong,
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
          isPlaying: false,
          progress: 0,
        };
      }

      const currentSong = state.currentSong;
      let newCurrentIndex = -1;
      let newCurrentSong = null;

      if (currentSong) {
        const currentItemIndex = preservedItems.findIndex(
          (item) => item.song.id === currentSong.id && item.isQueued
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
          (item) => item.song.id === state.currentSong!.id
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
        progress: newCurrentSong === state.currentSong ? state.progress : 0,
      };
    }

    case "REMOVE_ITEM": {
      const newQueue = state.queue.filter((item) => item.id !== action.itemId);

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

      const removedIndex = state.queue.findIndex(
        (item) => item.id === action.itemId
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
    currentIndex: -1,
    queue: [],
    progress: 0,
    duration: 0,
    volume: 1,
    isLoading: false,
    error: null,
  };

  const [state, dispatch] = useReducer(audioQueueReducer, initialState);
  const audioManager = useAudioManager();

  useEffect(() => {
    dispatch({ type: "SET_PLAYING", isPlaying: audioManager.isPlaying });
  }, [audioManager.isPlaying]);

  useEffect(() => {
    dispatch({ type: "SET_PROGRESS", progress: audioManager.progress });
  }, [audioManager.progress]);

  useEffect(() => {
    dispatch({ type: "SET_DURATION", duration: audioManager.duration });
  }, [audioManager.duration]);

  useEffect(() => {
    dispatch({ type: "SET_VOLUME", volume: audioManager.volume });
  }, [audioManager.volume]);

  useEffect(() => {
    dispatch({ type: "SET_LOADING", isLoading: audioManager.isLoading });
  }, [audioManager.isLoading]);

  useEffect(() => {
    dispatch({ type: "SET_ERROR", error: audioManager.error });
  }, [audioManager.error]);

  useEffect(() => {
    if (state.currentSong && state.currentSong !== audioManager.currentSong) {
      audioManager.play(state.currentSong);
    }
  }, [state.currentSong, audioManager]);

  const actions = {
    play: async (songOrList: Song | Song[]) => {
      if (Array.isArray(songOrList)) {
        dispatch({ type: "PLAY_LIST", songs: songOrList });
      } else {
        dispatch({ type: "PLAY_SONG", song: songOrList });
      }
    },

    pause: () => {
      audioManager.pause();
    },

    resume: () => {
      audioManager.resume();
    },

    next: () => {
      dispatch({ type: "NEXT_SONG" });
    },

    previous: () => {
      dispatch({ type: "PREVIOUS_SONG" });
    },

    seek: (time: number) => {
      audioManager.seek(time);
    },

    setVolume: (volume: number) => {
      audioManager.setVolume(volume);
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
      if (validSongs.length !== songs.length) {
        console.warn(
          `Filtered out ${songs.length - validSongs.length} invalid songs`
        );
      }
      dispatch({ type: "REPLACE_QUEUE", songs: validSongs, preserveQueued });
    },

    stop: () => {
      audioManager.stop();
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
