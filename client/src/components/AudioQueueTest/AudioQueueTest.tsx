import React from "react";
import { useAudioQueue } from "@contexts";
import type { Song } from "@types";

const testSongs: Song[] = [
  {
    id: "test-1",
    title: "Test Song 1",
    duration: 180,
    genre: "Test",
    release_date: "2024-01-01",
    audio_url: "open-window.mp3",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "test-2",
    title: "Test Song 2",
    duration: 200,
    genre: "Test",
    release_date: "2024-01-01",
    audio_url: "june-forever.mp3",
    created_at: "2024-01-01T00:00:00Z",
  },
];

const AudioQueueTest: React.FC = () => {
  const { state, actions } = useAudioQueue();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", margin: "20px" }}>
      <h3>AudioQueue Test Component</h3>

      <div style={{ marginBottom: "10px" }}>
        <strong>Current Song:</strong> {state.currentSong?.title || "None"}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Status:</strong> {state.isPlaying ? "Playing" : "Paused"}
        {state.isLoading && " (Loading...)"}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Progress:</strong> {formatTime(state.progress)} /{" "}
        {formatTime(state.duration)}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Queue:</strong> {state.queue.length} songs
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Current Index:</strong> {state.currentIndex}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Navigation:</strong>
        Previous: {state.hasPreviousSong ? "Available" : "Disabled"} | Next:{" "}
        {state.hasNextSong ? "Available" : "Disabled"}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Volume:</strong> {Math.round(state.volume * 100)}%
      </div>

      {state.error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          <strong>Error:</strong> {state.error}
        </div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <h4>Playback Controls:</h4>
        <button onClick={() => actions.play(testSongs[0])}>Play Song 1</button>
        <button
          onClick={() => actions.play(testSongs)}
          style={{ marginLeft: "10px" }}
        >
          Play Playlist
        </button>
        <button onClick={actions.pause} style={{ marginLeft: "10px" }}>
          Pause
        </button>
        <button onClick={actions.resume} style={{ marginLeft: "10px" }}>
          Resume
        </button>
        <button
          onClick={actions.next}
          disabled={!state.hasNextSong}
          style={{ marginLeft: "10px" }}
        >
          Next {!state.hasNextSong && "(Disabled)"}
        </button>
        <button
          onClick={actions.previous}
          disabled={!state.hasPreviousSong}
          style={{ marginLeft: "10px" }}
        >
          Previous {!state.hasPreviousSong && "(Disabled)"}
        </button>
        <button onClick={actions.stop} style={{ marginLeft: "10px" }}>
          Stop
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <h4>Queue Controls:</h4>
        <button onClick={() => actions.queueNext(testSongs[1])}>
          Queue Song 2 Next
        </button>
        <button
          onClick={() => actions.queueLast(testSongs[0])}
          style={{ marginLeft: "10px" }}
        >
          Queue Song 1 Last
        </button>
        <button
          onClick={() => actions.clearQueue()}
          style={{ marginLeft: "10px" }}
        >
          Clear Queue (Preserve User)
        </button>
        <button
          onClick={() => actions.clearQueue(false)}
          style={{ marginLeft: "10px" }}
        >
          Clear All
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <h4>Volume Control:</h4>
        <input
          type="range"
          min="0"
          max="100"
          value={state.volume * 100}
          onChange={(e) => actions.setVolume(parseInt(e.target.value) / 100)}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <h4>Seek Control:</h4>
        <input
          type="range"
          min="0"
          max="100"
          value={state.duration ? (state.progress / state.duration) * 100 : 0}
          onChange={(e) => {
            const seekTime = (state.duration * parseInt(e.target.value)) / 100;
            actions.seek(seekTime);
          }}
          disabled={!state.currentSong}
        />
      </div>

      <div>
        <h4>Current Queue:</h4>
        <ul>
          {state.queue.map((item, index) => (
            <li
              key={item.id}
              style={{
                fontWeight: index === state.currentIndex ? "bold" : "normal",
                color: item.isQueued ? "blue" : "black",
              }}
            >
              {item.song.title} {item.isQueued && "(User Queued)"}{" "}
              {index === state.currentIndex && "← Current"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AudioQueueTest;
