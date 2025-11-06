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
  PlayableEntity,
  RepeatMode,
  Playlist,
  Album,
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
  toggleQueueShuffle,
  saveAudioQueueState,
  loadAudioQueueState,
  createDebouncedSave,
  isLocalStorageAvailable,
} from "@util";
import { songApi, playlistApi, albumApi, artistApi } from "@api";
import { AUDIO_QUEUE_STORAGE_KEYS, AUDIO_CONSTANTS } from "@constants";

const isSong = (entity: PlayableEntity): entity is Song => {
  return !Array.isArray(entity) && entity.type === "song";
};
const isSongList = (entity: PlayableEntity): entity is Song[] => {
  return Array.isArray(entity) && entity.every((item) => item.type === "song");
};
const isPlaylist = (entity: PlayableEntity): entity is Playlist => {
  return !Array.isArray(entity) && entity.type === "playlist";
};
const isAlbum = (entity: PlayableEntity): entity is Album => {
  return !Array.isArray(entity) && entity.type === "album";
};

const AudioQueueContext = createContext<AudioQueueContextType | null>(null);

function audioQueueReducer(
  state: AudioState,
  action: QueueOperation
): AudioState {
  switch (action.type) {
    case "PLAY_SONG": {
      const newQueueItem = createQueueItem(action.song, false, 0);
      return {
        ...state,
        queue: [newQueueItem],
        currentIndex: 0,
        currentSong: action.song,
        currentQueueId: newQueueItem.queueId,
        error: null,
        isShuffled: false,
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
        isShuffled: false,
      };
    }

    case "QUEUE_NEXT": {
      const insertPosition = state.currentIndex + 1;
      const relativePosition = 1;
      const newQueueItem = createQueueItem(
        action.song,
        true,
        undefined,
        "next",
        relativePosition
      );

      if (state.queue.length === 0) {
        return {
          ...state,
          queue: [newQueueItem],
          currentIndex: 0,
          currentSong: action.song,
          currentQueueId: newQueueItem.queueId,
        };
      }

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
      const newQueueItem = createQueueItem(
        action.song,
        true,
        undefined,
        "last",
        undefined
      );

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
      const preserveCurrentSong = action.preserveCurrentSong ?? true;

      if (!preserveQueued && !preserveCurrentSong) {
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

      let preservedItems: QueueItem[] = [];
      if (preserveQueued) {
        preservedItems = filterPreservedItems(state.queue);
      }

      if (preserveCurrentSong && state.currentSong && state.currentIndex >= 0) {
        const currentItem = state.queue[state.currentIndex];
        if (
          currentItem &&
          !preservedItems.some((item) => item.queueId === currentItem.queueId)
        ) {
          preservedItems.unshift(currentItem);
        }
      }

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
      let newCurrentQueueId = null;

      if (preserveCurrentSong && currentSong) {
        // Find the current song in preserved items
        const currentItemIndex = preservedItems.findIndex(
          (item) => item.queueId === state.currentQueueId
        );

        if (currentItemIndex !== -1) {
          newCurrentIndex = currentItemIndex;
          newCurrentSong = currentSong;
          newCurrentQueueId = preservedItems[currentItemIndex].queueId;
        }
      }

      // If current song wasn't preserved or found, set to first preserved item
      if (newCurrentIndex === -1 && preservedItems.length > 0) {
        newCurrentIndex = 0;
        newCurrentSong = preservedItems[0].song;
        newCurrentQueueId = preservedItems[0].queueId;
      }

      return {
        ...state,
        queue: preservedItems,
        currentIndex: newCurrentIndex,
        currentSong: newCurrentSong,
        currentQueueId: newCurrentQueueId,
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

    case "TOGGLE_SHUFFLE_QUEUE": {
      const { newQueue, newCurrentIndex, newShuffleState } = toggleQueueShuffle(
        state.queue,
        state.currentIndex,
        state.isShuffled
      );

      return {
        ...state,
        queue: newQueue,
        currentIndex: newCurrentIndex,
        isShuffled: newShuffleState,
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
        isShuffled: false,
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
    volume: 0.8,
    isLoading: false,
    error: null,
    repeatMode: "none",
    isShuffled: false,
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
              const song = await songApi.getSongById(persistedItem.songId, {
                includeArtists: true,
              });
              if (song) {
                restoredItems.push({
                  song,
                  isQueued: persistedItem.isQueued,
                  queueId: `restored_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 11)}`,
                  originalIndex: restoredItems.length,
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

            if (currentSong) {
              audioManager.setCurrentSong(currentSong);
            }
          } else {
            console.log("No songs could be restored from persisted state");
          }
        } catch (error) {
          console.error("Failed to restore queue:", error);
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
      const currentLoading = audioManager.isLoading;
      if (currentLoading !== state.isLoading) {
        console.log(
          "AudioQueue - isLoading changed from",
          state.isLoading,
          "to",
          currentLoading
        );
      }
      dispatch({ type: "SET_LOADING", isLoading: currentLoading });
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
    play: async (playable: PlayableEntity) => {
      try {
        if (isSong(playable)) {
          dispatch({ type: "PLAY_SONG", song: playable });
          await audioManager.play(playable);
          dispatch({ type: "SET_PLAYING", isPlaying: true });
        } else if (isSongList(playable)) {
          dispatch({ type: "PLAY_LIST", songs: playable });
          if (playable.length > 0) {
            await audioManager.play(playable[0]);
            dispatch({ type: "SET_PLAYING", isPlaying: true });
          }
        } else if (isPlaylist(playable)) {
          const songs = await playlistApi.getSongs(playable.id, {
            includeArtists: true,
          });
          dispatch({ type: "PLAY_LIST", songs });
          if (songs.length > 0) {
            await audioManager.play(songs[0]);
            dispatch({ type: "SET_PLAYING", isPlaying: true });
          }
        } else if (isAlbum(playable)) {
          const songs = await albumApi.getSongs(playable.id, {
            includeArtists: true,
          });
          dispatch({ type: "PLAY_LIST", songs });
          if (songs.length > 0) {
            await audioManager.play(songs[0]);
            dispatch({ type: "SET_PLAYING", isPlaying: true });
          }
        } else {
          console.warn("Invalid playable entity provided to play");
        }
      } catch (err) {
        console.error("Failed to play audio:", err);
        dispatch({
          type: "SET_ERROR",
          error: "Failed to load audio. The file may be unavailable.",
        });
        dispatch({ type: "SET_PLAYING", isPlaying: false });
      }
    },

    playArtist: async (artistId: string) => {
      try {
        // TODO: pagination
        const songs = await artistApi.getSongs(artistId, {
          includeArtists: true,
          orderByColumn: "streams",
          orderByDirection: "DESC",
        });

        if (songs.length === 0) {
          console.warn("No songs found for artist");
          return;
        }

        dispatch({ type: "PLAY_LIST", songs });
        await audioManager.play(songs[0]);
        dispatch({ type: "SET_PLAYING", isPlaying: true });
      } catch (err) {
        console.error("Failed to play audio:", err);
        dispatch({
          type: "SET_ERROR",
          error: "Failed to load audio. The file may be unavailable.",
        });
        dispatch({ type: "SET_PLAYING", isPlaying: false });
      }
    },

    pause: () => {
      audioManager.pause();
      dispatch({ type: "SET_PLAYING", isPlaying: false });
    },

    resume: async () => {
      if (state.currentSong) {
        try {
          await audioManager.resume();
          dispatch({ type: "SET_PLAYING", isPlaying: true });
        } catch (err) {
          console.error("Failed to resume audio:", err);
          dispatch({
            type: "SET_ERROR",
            error: "Failed to load audio. The file may be unavailable.",
          });
          dispatch({ type: "SET_PLAYING", isPlaying: false });
        }
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
      if (state.progress > AUDIO_CONSTANTS.PREVIOUS_SONG_THRESHOLD) {
        audioManager.seek(0);
        dispatch({ type: "SET_PROGRESS", progress: 0 });
      } else {
        const prevIndex = getPreviousIndex(state.currentIndex);
        if (prevIndex !== null && state.queue[prevIndex]) {
          dispatch({ type: "PREVIOUS_SONG" });
          await audioManager.play(state.queue[prevIndex].song);
          dispatch({ type: "SET_PLAYING", isPlaying: true });
        }
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

    clearQueue: (
      preserveQueued?: boolean,
      preserveCurrentSong: boolean = true
    ) => {
      dispatch({ type: "CLEAR_QUEUE", preserveQueued, preserveCurrentSong });
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
      dispatch({
        type: "CLEAR_QUEUE",
        preserveQueued: false,
        preserveCurrentSong: false,
      });
    },

    removeFromQueue: (itemId: string) => {
      if (!itemId) {
        console.warn("Invalid itemId provided to removeFromQueue");
        return;
      }
      dispatch({ type: "REMOVE_ITEM", itemId });
    },

    toggleShuffleQueue: () => {
      dispatch({ type: "TOGGLE_SHUFFLE_QUEUE" });
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
        const restoredItems: QueueItem[] = [];
        for (const persistedItem of persistedState.queue) {
          try {
            const song = await songApi.getSongById(persistedItem.songId, {
              includeArtists: true,
            });
            if (song) {
              restoredItems.push({
                song,
                isQueued: persistedItem.isQueued,
                queueId: `restored_${Date.now()}_${Math.random()
                  .toString(36)
                  .substring(2, 11)}`,
                originalIndex: restoredItems.length,
              });
            }
          } catch (error) {
            console.warn(
              `Failed to fetch song ${persistedItem.songId}:`,
              error
            );
          }
        }

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

        if (currentSong) {
          audioManager.setCurrentSong(currentSong);
        }

        return true;
      } catch (error) {
        console.error("Failed to restore state with songs:", error);
        return false;
      }
    },
  };

  const contextValue: AudioQueueContextType = {
    state: {
      ...state,
      hasNextSong:
        getNextIndex(state.currentIndex, state.queue.length) !== null,
      hasPreviousSong:
        getPreviousIndex(state.currentIndex) !== null ||
        state.progress > AUDIO_CONSTANTS.PREVIOUS_SONG_THRESHOLD,
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
