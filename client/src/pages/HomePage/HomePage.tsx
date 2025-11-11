import React, { useMemo } from "react";
import { useAsyncData } from "@hooks";
import { useAuth } from "@contexts";
import { songApi } from "@api";
import { PuffLoader } from "react-spinners";
import styles from "./HomePage.module.css";
import SongCard from "../../components/SongCard/SongCard";
import FeaturedSection from "../../components/HomePage/FeaturedSection/FeaturedSection";
import type { SuggestedSong } from "@types";

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Mock data for recently played (still hardcoded)
  const recentSongs = Array(8).fill({
    title: "Song Title",
    artist: "Artist Name",
    image: "/PlayerBar/Mask group.png",
    plays: 1234,
    likes: 234,
    comments: 12,
  });

  // Fetch a popular song and then get its suggestions
  const asyncConfig = useMemo(
    () => ({
      suggestions: async () => {
        // First get a popular song (ordered by streams, most popular first)
        const songs = await songApi.getSongs({
          orderByColumn: "streams",
          orderByDirection: "DESC",
          limit: 1,
        });
        
        if (!songs || songs.length === 0) {
          return [];
        }

        const popularSongId = songs[0].id;
        
        // Then get suggestions based on that song
        return await songApi.getSuggestedSongs(popularSongId, {
          userId: isAuthenticated && user ? user.id : undefined,
          includeArtists: true,
          includeLikes: true,
          includeComments: true,
          limit: 10, // Get more suggestions than we might display
        });
      },
    }),
    [isAuthenticated, user]
  );

  const { data, loading, error } = useAsyncData(asyncConfig, [isAuthenticated, user], {
    cacheKey: "homepage_suggestions",
    hasBlobUrl: true,
  });

  // Map suggested songs to SongCard format
  const newSongs = useMemo(() => {
    if (!data?.suggestions) return [];
    
    return data.suggestions.map((song: SuggestedSong) => ({
      id: song.id,
      title: song.title,
      artist: song.main_artist?.display_name || "Unknown Artist",
      image: song.image_url || "/PlayerBar/Mask group.png",
      plays: song.streams || 0,
      likes: song.likes || 0,
      comments: song.comments || 0,
    }));
  }, [data?.suggestions]);

  return (
    <main className={styles.contentArea}>
      <div className={styles.contentWrapper}>
        {/* Top Grid Layout */}
        <div className={styles.topGrid}>
          {/* Featured Column */}
          <section className={styles.section}>
            {/* Featured Section */}
            <FeaturedSection
              title="Chill Vibes"
              description="Smooth beats and ambient tunes to keep you relaxed."
              image= "https://placehold.co/600x400"
              likes={10234}
              tracks={58}
              duration="2h 15min"
            />
          </section>

          {/* Recently Played Column */}
          <section className={styles.recentlyPlayedColumn}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recently Played</h2>
              <a href="#" className={styles.viewMore}>
                View More
              </a>
            </div>
            <div className={styles.verticalCardsList}>
              {recentSongs.map((song, index) => (
                <div key={index} className={styles.compactCard}>
                  <img src={song.image} alt={song.title} />
                  <div className={styles.songInfo}>
                    <h3 className={styles.songTitle}>{song.title}</h3>
                    <p className={styles.artistName}>{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* New Releases Section - Full Width */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>New Releases</h2>
            <a href="#" className={styles.viewMore}>
              View More
            </a>
          </div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <PuffLoader color="#D53131" size={50} />
            </div>
          ) : error ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              Failed to load new releases. Please try again later.
            </div>
          ) : newSongs.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              No new releases available.
            </div>
          ) : (
            <div className={styles.cardsContainer}>
              {newSongs.map((song) => (
                <SongCard key={song.id} {...song} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default HomePage;
