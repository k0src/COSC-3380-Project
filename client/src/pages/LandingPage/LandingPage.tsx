import React, { useState } from "react";
import styles from "./LandingPage.module.css";
import { LuSearch } from "react-icons/lu";
import { SongCard, UploadPromptModal } from "@components";
import { useAsyncData } from "@hooks";
import { songApi } from "@api";
import type { Song } from "@types";
import { Link, useNavigate } from "react-router-dom";
import musicPlaceholder from "@assets/music-placeholder.webp";
import { getMainArtist } from "@util";

const LandingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);

  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const { data, loading, error } = useAsyncData(
    {
      singles: () => songApi.getMany({ includeArtists: true, limit: 4 }),
    },
    [],
    { cacheKey: "landing_page" }
  );

  const singles: Song[] = data?.singles || [];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.navbar}>
        <div className={styles.logo}>COOGMUSIC</div>
        <nav className={styles.navButtons}>
          <Link to="/signup">
            <button className={`${styles.navButton} ${styles.signUpButton}`}>
              SIGN UP
            </button>
          </Link>
          <Link to="/login">
            <button className={`${styles.navButton} ${styles.loginButton}`}>
              LOGIN
            </button>
          </Link>
        </nav>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>BY ARTISTS, FOR ARTISTS</h1>
          <p className={styles.heroSubtitle}>
            Get obsessed, or become part of someone's obsession. All it takes is
            an upload!
          </p>
          <button
            className={styles.uploadButton}
            onClick={() => setShowUploadModal(true)}
          >
            UPLOAD NOW
          </button>
        </div>
      </section>

      <UploadPromptModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      <div className={styles.searchBarContainer}>
        <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
          <LuSearch />
          <input
            type="text"
            placeholder="SEARCH SONGS, ARTISTS, PLAYLISTS"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <main className={styles.mainContent}>
        <h2 className={styles.trendingHeader}>Or Listen to whats Trending</h2>
        <div className={styles.trendingSection}>
          {loading && <div>Loading...</div>}
          {Boolean(error) && (
            <div className={styles.errorText}>Error loading songs.</div>
          )}

          {/* You must check if 'singles' exists before mapping */}
          {!loading &&
            !Boolean(error) &&
            singles &&
            singles.map((song: Song) => (
              <Link
                to={`/songs/${song.id}`}
                key={song.id}
                className={styles.songCardLink}
              >
                <SongCard
                  image={song.image_url || musicPlaceholder}
                  artist={
                    getMainArtist(song.artists || [])?.display_name ||
                    "Unknown Artist"
                  }
                  title={song.title}
                  plays={song.streams ?? 0}
                  likes={0}
                  comments={0}
                />
              </Link>
            ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
