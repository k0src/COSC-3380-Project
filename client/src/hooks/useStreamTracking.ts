import { useState, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";

const STREAM_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface UseStreamTrackingParams {
  songId: string;
  wavesurferRef: React.RefObject<WaveSurfer | null>;
  onStream: (songId: string) => void;
}

/**
 * Hook to track if a song has been streamed in the current session (24h).
 * @param param.songId - The ID of the song to track.
 * @param param.wavesurferRef - Ref to the WaveSurfer instance.
 * @param param.onStream - Callback to invoke when the song is streamed.
 * @returns
 */
export const useStreamTracking = ({
  songId,
  wavesurferRef,
  onStream,
}: UseStreamTrackingParams) => {
  const [hasStreamedThisSession, setHasStreamedThisSession] = useState(false);

  useEffect(() => {
    const streamKey = `streamed_${songId}`;
    const streamData = localStorage.getItem(streamKey);

    if (streamData) {
      const { timestamp } = JSON.parse(streamData);
      const isExpired = Date.now() - timestamp > STREAM_TTL;

      if (!isExpired) {
        setHasStreamedThisSession(true);
      } else {
        localStorage.removeItem(streamKey);
      }
    }
  }, [songId]);

  useEffect(() => {
    if (!wavesurferRef.current || hasStreamedThisSession) return;

    const ws = wavesurferRef.current;

    const handlePlay = () => {
      onStream(songId);
      setHasStreamedThisSession(true);

      const streamKey = `streamed_${songId}`;
      localStorage.setItem(
        streamKey,
        JSON.stringify({ timestamp: Date.now() })
      );
    };

    ws.once("play", handlePlay);

    return () => {
      ws.un("play", handlePlay);
    };
  }, [wavesurferRef.current, songId, hasStreamedThisSession, onStream]);

  return { hasStreamedThisSession };
};
