import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import homeStyles from "../HomePage/HomePage.module.css";
import styles from "./SearchResultsPage.module.css";
import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";
import SongCard from "../../components/SongCard/SongCard";
import { fetchSearch, type SearchResponse } from "../../api/search.api";

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [results, setResults] = useState<SearchResponse>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) return;

    const loadResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSearch(query, "all", 20, 0);
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
        setError("Failed to load search results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [query]);

  const songs = results.songs ?? [];
  const artists = results.artists ?? [];
  const albums = results.albums ?? [];
  const playlists = results.playlists ?? [];

  return (
    <>
      <Topbar />
      <Sidebar />


      <main className={homeStyles.contentArea}>
        <div className={homeStyles.contentWrapper}>
          {loading && <p className={styles.loading}>Loading...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && !error && (
            <>
              <section className={homeStyles.recentlyPlayedColumn}>
                <div className={homeStyles.sectionHeader}>
                  <h2 className={homeStyles.sectionTitle}>Songs</h2>
                </div>
                <div className={homeStyles.verticalCardsList}>
                  {songs.map((song, index) => (
                    <div key={index} className={homeStyles.compactCard}>
                      <img src={song.image} alt={song.title} />
                      <div className={homeStyles.songInfo}>
                        <h3 className={homeStyles.songTitle}>{song.title}</h3>
                        <p className={homeStyles.artistName}>{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Artists Section */}
              <section className={homeStyles.section}>
                <div className={homeStyles.sectionHeader}>
                  <h2 className={homeStyles.sectionTitle}>Artists</h2>
                </div>
                <div className={homeStyles.cardsContainer}>
                  {artists.map((artist, index) => (
                    <SongCard
                      key={`artist-${index}`}
                      title={artist.name}
                      artist={""}
                      image={artist.image}
                      plays={artist.plays}
                      likes={artist.likes ?? 0}
                      comments={artist.comments ?? 0}
                      showStats={false}
                    />
                  ))}
                </div>
              </section>

              {/* Albums Section */}
              <section className={homeStyles.section}>
                <div className={homeStyles.sectionHeader}>
                  <h2 className={homeStyles.sectionTitle}>Albums</h2>
                </div>
                <div className={homeStyles.cardsContainer}>
                  {albums.map((album, index) => (
                    <SongCard
                      key={`album-${index}`}
                      title={album.title}
                      artist={album.artist}
                      image={album.image}
                      plays={album.plays ?? 0}
                      likes={album.likes ?? 0}
                      comments={album.comments ?? 0}
                      showStats={false}
                    />
                  ))}
                </div>
              </section>

              {/* Playlists Section */}
              <section className={homeStyles.section}>
                <div className={homeStyles.sectionHeader}>
                  <h2 className={homeStyles.sectionTitle}>Playlists</h2>
                </div>
                <div className={homeStyles.cardsContainer}>
                  {playlists.map((pl, index) => (
                    <SongCard
                      key={`pl-${index}`}
                      title={pl.title}
                      artist={pl.artist}
                      image={pl.image}
                      plays={pl.plays ?? 0}
                      likes={pl.likes ?? 0}
                      comments={pl.comments ?? 0}
                      showStats={false}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <PlayerBar />
    </>
  );
}
