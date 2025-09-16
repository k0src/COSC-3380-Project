import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { songApi } from "../../api/song.api.js";
import type { Song } from "../../types";

import styles from "./TestPage.module.css";
import { FaDatabase } from "react-icons/fa";

const TestPage: React.FC = () => {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const songId = "3960d25f-4c52-401a-befc-a4d86cd079e7";

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const songData = await songApi.getSongById(songId);
      setSong(songData);
    } catch (error) {
      console.error("Error fetching song data:", error);
      setError("Failed to fetch song data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Test Page</title>
      </Helmet>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.headingPrimary}>Test Page</h1>
        </header>

        <div className={styles.testContainer}>
          <button className={styles.testButton} onClick={fetchData}>
            <span className={styles.testText}>Fetch Song</span>
            <FaDatabase className={styles.testIcon} />
          </button>

          <div className={styles.testContent}>
            {loading && <span className={styles.infoText}>Loading...</span>}
            {error && <span className={styles.errorText}>{error}</span>}
            {song && (
              <div className={styles.songDetails}>
                <img
                  src={song.image_url || undefined}
                  alt={song.title}
                  className={styles.songImage}
                />
                <audio
                  controls
                  src={song.audio_url}
                  className={styles.audioPlayer}
                ></audio>
                <span className={styles.songInfoText}>ID: {song.id}</span>
                <span className={styles.songInfoText}>Title: {song.title}</span>
                <span className={styles.songInfoText}>
                  Release Date: {song.release_date}
                </span>
                <span className={styles.songInfoText}>
                  Image URL: {song.image_url}
                </span>
                <span className={styles.songInfoText}>
                  Audio URL: {song.audio_url}
                </span>
                <span className={styles.songInfoText}>
                  Created At: {new Date(song.created_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default TestPage;
