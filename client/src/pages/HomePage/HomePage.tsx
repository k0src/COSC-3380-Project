import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAsyncData } from "@hooks";
import { useAuth } from "@contexts";
import { songApi, playlistApi, userApi } from "@api";
import { PuffLoader } from "react-spinners";
import styles from "./HomePage.module.css";
import SongCard from "../../components/SongCard/SongCard";
import { FeaturedSection } from "@components";
import type { SuggestedSong, UUID, Playlist, Song } from "@types";

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const FEATURED_PLAYLIST_ID: UUID = "0b44c6a2-6dc5-42ef-a847-85b291df8eb5"; //hardcoded for now

  // No mock recent songs; we'll show a friendly empty state when user has no history

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

      featuredPlaylist: async () => {
        // Don't fetch if ID is not set
        if (!FEATURED_PLAYLIST_ID) return null; 

        return await playlistApi.getPlaylistById(FEATURED_PLAYLIST_ID, {
          includeUser: true, // To show "Created by..."
          includeLikes: true,
          includeSongCount: true, // To show "X songs"
          includeRuntime: true, // To show total runtime
        });
      },

      // Recent songs from user's history (limit 10)
      recentSongs: async () => {
        if (!isAuthenticated || !user) return [];
        try {
          const songs = await userApi.getHistorySongs(user.id, { limit: 10 });
          console.log("Fetched recent songs:", songs);
          return songs;
        } catch (err) {
          return [];
        }
      },

    }),
    [isAuthenticated, user]
  );

  

  const { data, loading, error } = useAsyncData(asyncConfig, [isAuthenticated, user], {
    cacheKey: "homepage_data", // <-- Renamed from "homepage_suggestions"
    hasBlobUrl: true,
  });

  const playlist = data?.featuredPlaylist;

  const handleToggleExpand = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Stop the <a> tag from refreshing the page
    event.preventDefault(); 
    
    // Toggle the state value (from false to true, or true to false)
    setIsExpanded((prevExpanded: any) => !prevExpanded);
  };

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

  // Map recent songs (from history) to a simple display shape, fallback to mock
  const recentSongsDisplay = useMemo(() => {
    if (data?.recentSongs && Array.isArray(data.recentSongs) && data.recentSongs.length > 0) {
      return (data.recentSongs as Song[]).map((s) => ({
        id: s.id,
        title: s.title,
        artist:
          // prefer a main_artist field if present, otherwise check artists array
          (s as any).main_artist?.display_name || (s.artists && s.artists[0]?.display_name) || "Unknown Artist",
        image: s.image_url || "/PlayerBar/Mask group.png",
      }));
    }

    return [];
  }, [data?.recentSongs]);

  return (
    <main className={styles.contentArea}>
      <div className={styles.contentWrapper}>
        {/* Top Grid Layout */}
        <div className={styles.topGrid}>
          {/* Featured Column */}
          <section className={styles.section}>
            {/* Featured Section */}
            <h2 className={styles.sectionTitle}>Featured Playlist</h2>
              {loading && (
              <div className="featuredSection">
                {/* You can put a loading skeleton here */}
                <p>Loading...</p>
              </div>
            )}
            {Boolean(error) && (
              <div className="featuredSection">
                <p>Error loading playlist.</p>
              </div>
            )}
            {/* On success, render the card */}
            {!loading && !error && playlist && (
              <FeaturedSection playlist={playlist} />
            )}
          </section>

          {/* Recently Played Column */}
          <section className={styles.recentlyPlayedColumn}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recently Played</h2>
            </div>
            <div className={styles.verticalCardsList}>
              {recentSongsDisplay.length === 0 ? (
                <div className={styles.emptyRecent}>
                  You haven't played any songs yet.
                </div>
              ) : (
                recentSongsDisplay.map((song) => (
                  <Link
                    key={song.id || song.title}
                    to={song.id ? `/songs/${song.id}` : "#"}
                    className={styles.compactCard}
                  >
                    <img src={song.image} alt={song.title} />
                    <div className={styles.songInfo}>
                      <h3 className={styles.songTitle}>{song.title}</h3>
                      <p className={styles.artistName}>{song.artist}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        {/* New Releases Section - Full Width */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>New Releases</h2>
            <a href="#" className={styles.viewMore} onClick={handleToggleExpand}>
              {isExpanded ? "Show Less" : "View More"}
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
            <div className={`${styles.cardsContainer} ${isExpanded ? styles.expanded : ""}`}>
              {newSongs.map((song) => (
                <Link key={song.id} to={`/songs/${song.id}`}>
                  <SongCard {...song} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default HomePage;
