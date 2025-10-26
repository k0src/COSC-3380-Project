import React, { useState, useEffect } from "react";
import { useAudioQueue } from "@contexts";
import { songApi } from "@api";
import type { Song } from "@types";

const SONG_IDS = [
  "3960d25f-4c52-401a-befc-a4d86cd079e7",
  "7d7c882d-21df-4645-8452-43c1015993f3",
  "385c64a0-f8b6-47c4-bb5f-c98a6e3daf82",
  "7d3422bb-4bb2-4fa7-a9a5-e715b432ce3f",
  "8ac798e2-605e-4d3b-bc45-db87af811cab",
  "6ac89875-9d7b-4a70-8324-dd0a03244736",
];

const AudioQueueTest: React.FC = () => {
  const { state, actions } = useAudioQueue();
  const [testSongs, setTestSongs] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setIsLoadingSongs(true);
        setLoadError(null);

        const songs = await Promise.all(
          SONG_IDS.map(async (id) => {
            try {
              return await songApi.getSongById(id, { includeArtists: true });
            } catch (error) {
              console.warn(`Failed to fetch song ${id}:`, error);
              return null;
            }
          })
        );

        const validSongs = songs.filter((song): song is Song => song !== null);
        setTestSongs(validSongs);

        if (validSongs.length === 0) {
          setLoadError("No songs could be loaded from the API");
        }
      } catch (error) {
        console.error("Failed to fetch test songs:", error);
        setLoadError("Failed to load test songs");
      } finally {
        setIsLoadingSongs(false);
      }
    };

    fetchSongs();
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoadingSongs) {
    return (
      <div>
        <h3>AudioQueue Test</h3>
        <p>Loading songs from API...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h3>AudioQueue Test</h3>
        <p>Error: {loadError}</p>
      </div>
    );
  }

  if (testSongs.length === 0) {
    return (
      <div>
        <h3>AudioQueue Test Component</h3>
        <p>No test songs available.</p>
      </div>
    );
  }

  return (
    <div>
      <h3>AudioQueue Test</h3>
      <p>
        <strong>Loaded {testSongs.length} songs from API</strong>
      </p>

      <div>
        <strong>Current Song:</strong> {state.currentSong?.title || "None"}
      </div>

      <div>
        <strong>Status:</strong> {state.isPlaying ? "Playing" : "Paused"}
        {state.isLoading && " (Loading...)"}
      </div>

      <div>
        <strong>Progress:</strong> {formatTime(state.progress)} /{" "}
        {formatTime(state.duration)}
      </div>

      <div>
        <strong>Queue:</strong> {state.queue.length} songs
      </div>

      <div>
        <strong>Current Index:</strong> {state.currentIndex}
      </div>

      <div>
        <strong>Navigation:</strong>
        Previous: {state.hasPreviousSong ? "Available" : "Disabled"} | Next:{" "}
        {state.hasNextSong ? "Available" : "Disabled"}
      </div>

      <div>
        <strong>Volume:</strong> {Math.round(state.volume * 100)}%
      </div>

      <div>
        <strong>Repeat Mode:</strong> {state.repeatMode}
      </div>

      {state.error && (
        <div>
          <strong>Error:</strong> {state.error}
        </div>
      )}

      <div>
        <h4>Playback :</h4>
        <button onClick={() => actions.play(testSongs[0])}>
          Play {testSongs[0]?.title || "First Song"}
        </button>
        <button onClick={() => actions.play(testSongs)}>Play All Songs</button>
        <button onClick={actions.pause}>Pause</button>
        <button onClick={actions.resume}>Resume</button>
        <button onClick={actions.next} disabled={!state.hasNextSong}>
          Next {!state.hasNextSong && "(Disabled)"}
        </button>
        <button onClick={actions.previous} disabled={!state.hasPreviousSong}>
          Previous {!state.hasPreviousSong && "(Disabled)"}
        </button>
        <button onClick={actions.stop}>Stop</button>
        <button onClick={actions.toggleRepeatMode}>
          Repeat: {state.repeatMode}
        </button>
      </div>

      <div>
        <h4>Queue :</h4>
        <button
          onClick={() => actions.queueNext(testSongs[1])}
          disabled={!testSongs[1]}
        >
          Queue {testSongs[1]?.title || "Second Song"} Next
        </button>
        <button
          onClick={() => actions.queueLast(testSongs[0])}
          disabled={!testSongs[0]}
        >
          Queue {testSongs[0]?.title || "First Song"} Last
        </button>
        <button onClick={() => actions.clearQueue()}>
          Clear Queue (Preserve User)
        </button>
        <button onClick={() => actions.clearQueue(false)}>Clear All</button>
      </div>

      <div>
        <button onClick={actions.shuffleQueue}>Shuffle Queue</button>
        <button onClick={() => actions.moveQueueItem(0, 2)}>
          Move First Song to 3rd Position
        </button>
        <button
          onClick={() => {
            if (state.queue.length > 0) {
              actions.removeFromQueue(state.queue[0].queueId);
            }
          }}
        >
          Remove First Song
        </button>
      </div>

      <div>
        <h4>Persistence:</h4>
        <button onClick={actions.saveState}>Save State</button>
        <button onClick={actions.clearPersistedState}>Clear State</button>
        <button
          onClick={async () => {
            const success = await actions.restoreState();
            console.log("Manual restore result:", success);
          }}
        >
          Restore State
        </button>
      </div>

      <div>
        <h4>Volume:</h4>
        <input
          type="range"
          min="0"
          max="100"
          value={state.volume * 100}
          onChange={(e) => actions.setVolume(parseInt(e.target.value) / 100)}
        />
      </div>

      <div>
        <h4>Seek:</h4>
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
        <h4>Test Songs:</h4>
        <ul>
          {testSongs.map((song) => (
            <li key={song.id}>
              <strong>{song.title}</strong>
              <button onClick={() => actions.play(song)}>Play</button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4>Current Queue:</h4>
        <ul>
          {state.queue.map((item, index) => (
            <li key={item.queueId}>
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
