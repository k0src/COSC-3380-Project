import React from "react";
import { useAudioManager } from "@hooks";
import type { Song } from "@types";

const testSong: Song = {
  id: "test-song-1",
  title: "Test Song",
  duration: 180,
  genre: "Test",
  release_date: "2024-01-01",
  audio_url: "./june-forever.mp3",
  created_at: "2024-01-01T00:00:00Z",
};

const AudioManagerTest: React.FC = () => {
  const audioManager = useAudioManager();

  const handlePlay = async () => {
    try {
      await audioManager.play(testSong);
    } catch (error) {
      console.error("Failed to play:", error);
    }
  };

  const handleSeek = (percentage: number) => {
    const seekTime = (audioManager.duration * percentage) / 100;
    audioManager.seek(seekTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", margin: "20px" }}>
      <h3>AudioManager Test Component</h3>

      <div style={{ marginBottom: "10px" }}>
        <strong>Current Song:</strong>{" "}
        {audioManager.currentSong?.title || "None"}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Status:</strong> {audioManager.isPlaying ? "Playing" : "Paused"}
        {audioManager.isLoading && " (Loading...)"}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Progress:</strong> {formatTime(audioManager.progress)} /{" "}
        {formatTime(audioManager.duration)}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Volume:</strong> {Math.round(audioManager.volume * 100)}%
      </div>

      {audioManager.error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          <strong>Error:</strong> {audioManager.error}
        </div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <button onClick={handlePlay} disabled={audioManager.isLoading}>
          Play Test Song
        </button>
        <button
          onClick={audioManager.pause}
          disabled={!audioManager.isPlaying}
          style={{ marginLeft: "10px" }}
        >
          Pause
        </button>
        <button
          onClick={audioManager.resume}
          disabled={audioManager.isPlaying || !audioManager.currentSong}
          style={{ marginLeft: "10px" }}
        >
          Resume
        </button>
        <button
          onClick={audioManager.stop}
          disabled={!audioManager.currentSong}
          style={{ marginLeft: "10px" }}
        >
          Stop
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>
          Volume:
          <input
            type="range"
            min="0"
            max="100"
            value={audioManager.volume * 100}
            onChange={(e) =>
              audioManager.setVolume(parseInt(e.target.value) / 100)
            }
            style={{ marginLeft: "10px" }}
          />
        </label>
      </div>

      <div>
        <label>
          Seek:
          <input
            type="range"
            min="0"
            max="100"
            value={
              audioManager.duration
                ? (audioManager.progress / audioManager.duration) * 100
                : 0
            }
            onChange={(e) => handleSeek(parseInt(e.target.value))}
            disabled={!audioManager.currentSong}
            style={{ marginLeft: "10px" }}
          />
        </label>
      </div>
    </div>
  );
};

export default AudioManagerTest;
