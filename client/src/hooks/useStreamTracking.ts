import { useEffect, useState } from "react";
import { useAuth } from "@contexts";
import { useAudioQueue } from "@contexts/AudioQueueContext";
import { songApi, userApi } from "@api";

const STREAM_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MIN_PLAY_TIME = 10; // 10 seconds

export const useStreamTracking = () => {
  const { user } = useAuth();
  const { state } = useAudioQueue();

  const [trackedSongs, setTrackedSongs] = useState<Set<string>>(new Set());

  const hasStreamedRecently = (songId: string): boolean => {
    if (!user) return false;

    const streamKey = `streamed_${user.id}_${songId}`;
    const streamData = localStorage.getItem(streamKey);

    if (streamData) {
      try {
        const { timestamp } = JSON.parse(streamData);
        const isExpired = Date.now() - timestamp > STREAM_TTL;

        if (!isExpired) {
          return true;
        } else {
          localStorage.removeItem(streamKey);
        }
      } catch (error) {
        console.error("Error parsing stream data:", error);
        localStorage.removeItem(streamKey);
      }
    }

    return false;
  };

  useEffect(() => {
    const currentSongId = state.currentSong?.id;

    if (!user || !currentSongId || !state.isPlaying) return;
    if (trackedSongs.has(currentSongId)) return;
    if (hasStreamedRecently(currentSongId)) {
      setTrackedSongs((prev) => new Set(prev).add(currentSongId));
      return;
    }

    if (state.progress >= MIN_PLAY_TIME) {
      const trackStream = async () => {
        try {
          console.log("tracking stream for", currentSongId);
          await Promise.all([
            userApi.addToHistory(user.id, currentSongId, "song"),
            songApi.incrementSongStreams(currentSongId),
          ]);

          const streamKey = `streamed_${user.id}_${currentSongId}`;
          localStorage.setItem(
            streamKey,
            JSON.stringify({ timestamp: Date.now() })
          );

          setTrackedSongs((prev) => new Set(prev).add(currentSongId));
        } catch (error) {
          console.error("Error tracking stream:", error);
        }
      };

      trackStream();
    }
  }, [
    state.progress,
    state.currentSong?.id,
    state.isPlaying,
    user,
    trackedSongs,
  ]);
};
