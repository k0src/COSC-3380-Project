import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import homeStyles from "../HomePage/HomePage.module.css";
import styles from "./SearchResultsPage.module.css";
import { SongCard } from "@components";
import { searchApi, type SearchResults } from "../../api/search.api";

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) return;

    const loadResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchApi.search(query);
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

  const songs = results?.songs ?? [];
  const artists = results?.artists ?? [];
  const albums = results?.albums ?? [];
  const playlists = results?.playlists ?? [];

  return (
    <>      
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
                      <img src={(song as any).image_url || "/PlayerBar/Mask group.png"} alt={song.title} />
                      <div className={homeStyles.songInfo}>
                        <h3 className={homeStyles.songTitle}>{song.title}</h3>
                        <p className={homeStyles.artistName}>
                          {(song as any).artists && (song as any).artists.length > 0 ? (
                            (song as any).artists.map((a: any, i: number) => (
                              <span key={String(a.id || a.user_id || i)}>
                                <Link to={`/artists/${a.id || a.user_id}`}>{a.display_name || a.name || a.user?.display_name || "Artist"}</Link>
                                {i < (song as any).artists!.length - 1 ? ", " : ""}
                              </span>
                            ))
                          ) : (
                            (song as any).artist || ""
                          )}
                        </p>
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
                  {artists.map((artist: any, index) => {
                    const artistId = artist.id ?? artist.user?.id ?? artist.user_id;
                    return (
                      <Link key={`artist-${index}`} to={artistId ? `/artists/${artistId}` : "#"}>
                        <SongCard
                          title={artist.display_name || artist.name || "Artist"}
                          artist={""}
                          image={
                            artist.user?.profile_picture_url ||
                            artist.image_url ||
                            "/PlayerBar/Mask group.png"
                          }
                          plays={artist.plays ?? 0}
                          likes={artist.likes ?? 0}
                          comments={artist.comments ?? 0}
                        />
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Albums Section */}
              <section className={homeStyles.section}>
                <div className={homeStyles.sectionHeader}>
                  <h2 className={homeStyles.sectionTitle}>Albums</h2>
                </div>
                <div className={homeStyles.cardsContainer}>
                  {albums.map((album: any, index) => {
                    const albumId = album.id;
                    return (
                      <Link key={`album-${index}`} to={albumId ? `/albums/${albumId}` : "#"}>
                        <SongCard
                          title={album.title}
                          artist={""}
                          image={album.image_url || "/PlayerBar/Mask group.png"}
                          plays={album.plays ?? 0}
                          likes={album.likes ?? 0}
                          comments={album.comments ?? 0}
                        />
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Playlists Section */}
              <section className={homeStyles.section}>
                <div className={homeStyles.sectionHeader}>
                  <h2 className={homeStyles.sectionTitle}>Playlists</h2>
                </div>
                <div className={homeStyles.cardsContainer}>
                  {playlists.map((pl: any, index) => {
                    const playlistId = pl.id;
                    return (
                      <Link key={`pl-${index}`} to={playlistId ? `/playlists/${playlistId}` : "#"}>
                        <SongCard
                          title={pl.title}
                          artist={""}
                          image={pl.image_url || "/PlayerBar/Mask group.png"}
                          plays={pl.plays ?? 0}
                          likes={pl.likes ?? 0}
                          comments={pl.comments ?? 0}
                        />
                      </Link>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
