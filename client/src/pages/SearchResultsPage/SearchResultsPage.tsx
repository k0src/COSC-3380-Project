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
  console.log("Artists:", artists);
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
                  {songs.length === 0 ? (
                    <p className={styles.emptyMessage}>No songs found</p>
                  ) : (
                    songs.map((song) => (
                      <Link
                        key={song.id}
                        to={`/songs/${song.id}`}
                        className={homeStyles.compactCard}
                      >
                        <img src={(song as any).image_url} alt={song.title} />
                        <div className={homeStyles.songInfo}>
                          <h3 className={homeStyles.songTitle}>{song.title}</h3>
                          <p className={homeStyles.artistName}>
                            {(song as any).artists && (song as any).artists.length > 0 ? (
                              (song as any).artists.map((a: any, i: number) => (
                                <span key={String(a.id || a.user_id || i)}>
                                  {a.display_name || a.name || a.user?.display_name || "Artist"}
                                  {i < (song as any).artists!.length - 1 ? ", " : ""}
                                </span>
                              ))
                            ) : (
                              (song as any).artist || "Unknown Artist"
                            )}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              {/* Artists Section */}
              <section className={homeStyles.section}>
                <div className={homeStyles.sectionHeader}>
                  <h2 className={homeStyles.sectionTitle}>Artists</h2>
                </div>
                {artists.length === 0 ? (
                  <p className={styles.emptyMessage}>No artists found</p>
                ) : (
                  <div className={homeStyles.cardsContainer}>
                    {artists.map((artist: any) => {
                      const artistId = artist.id ?? artist.user?.id ?? artist.user_id;
                      return (
                        <Link key={artistId || artist.display_name} to={artistId ? `/artists/${artistId}` : "#"}>
                          <SongCard
                            title={artist.display_name || artist.name || "Artist"}
                            artist={""}
                            image={
                              artist.user?.profile_picture_url ||
                              artist.image_url
                            }
                            plays={artist.plays ?? 0}
                            likes={artist.likes ?? 0}
                            comments={artist.comments ?? 0}
                          />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Albums Section */}
              <section className={homeStyles.section}>
                <div className={homeStyles.sectionHeader}>
                  <h2 className={homeStyles.sectionTitle}>Albums</h2>
                </div>
                {albums.length === 0 ? (
                  <p className={styles.emptyMessage}>No albums found</p>
                ) : (
                  <div className={homeStyles.cardsContainer}>
                    {albums.map((album: any) => {
                      const albumId = album.id;
                      return (
                        <Link key={albumId || album.title} to={albumId ? `/albums/${albumId}` : "#"}>
                          <SongCard
                            title={album.title}
                            artist={""}
                            image={album.image_url}
                            plays={album.plays ?? 0}
                            likes={album.likes ?? 0}
                            comments={album.comments ?? 0}
                          />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Playlists Section */}
              <section className={homeStyles.section}>
                <div className={homeStyles.sectionHeader}>
                  <h2 className={homeStyles.sectionTitle}>Playlists</h2>
                </div>
                {playlists.length === 0 ? (
                  <p className={styles.emptyMessage}>No playlists found</p>
                ) : (
                  <div className={homeStyles.cardsContainer}>
                    {playlists.map((pl: any) => {
                      const playlistId = pl.id;
                      return (
                        <Link key={playlistId || pl.title} to={playlistId ? `/playlists/${playlistId}` : "#"}>
                          <SongCard
                            title={pl.title}
                            artist={""}
                            image={pl.image_url}
                            plays={pl.plays ?? 0}
                            likes={pl.likes ?? 0}
                            comments={pl.comments ?? 0}
                          />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}