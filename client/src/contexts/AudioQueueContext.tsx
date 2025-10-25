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
      dispatch({ type: "QUEUE_NEXT", song });
    },

    queueLast: (song: Song) => {
      dispatch({ type: "QUEUE_LAST", song });
    },

    clearQueue: (preserveQueued?: boolean) => {
      dispatch({ type: "CLEAR_QUEUE", preserveQueued });
    },

    replaceQueue: (songs: Song[], preserveQueued?: boolean) => {
      dispatch({ type: "REPLACE_QUEUE", songs, preserveQueued });
    },

    stop: () => {
      audioManager.stop();
      dispatch({ type: "CLEAR_QUEUE", preserveQueued: false });
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
