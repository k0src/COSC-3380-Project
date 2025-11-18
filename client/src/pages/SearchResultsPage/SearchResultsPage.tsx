import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import homeStyles from "../HomePage/HomePage.module.css";
import styles from "./SearchResultsPage.module.css";
import { LazyImg } from "@components";
import artistPlaceholder from "@assets/artist-placeholder.webp";
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

  const hasAnyResults =
      (songs && songs.length > 0) ||
      (artists && artists.length > 0) ||
      (albums && albums.length > 0) ||
      (playlists && playlists.length > 0);

    return (
      <>
        <main className={homeStyles.contentArea}>
          <div className={homeStyles.contentWrapper}>
            {loading && <p className={styles.loading}>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {!loading && !error && (
              <>
                {!hasAnyResults ? (
                  <p className={styles.emptyMessage}>No results found.</p>
                ) : (
                  <>
                    {songs && songs.length > 0 && (
                      <section className={homeStyles.recentlyPlayedColumn}>
                        <div className={homeStyles.sectionHeader}>
                          <h2 className={homeStyles.sectionTitle}>Songs</h2>
                        </div>
                        <div className={homeStyles.verticalCardsList}>
                          {songs.map((song) => (
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
                          ))}
                        </div>
                      </section>
                    )}

                    {artists && artists.length > 0 && (
                      <section className={homeStyles.section}>
                        <div className={homeStyles.sectionHeader}>
                          <h2 className={homeStyles.sectionTitle}>Artists</h2>
                        </div>
                        <div className={homeStyles.cardsContainer}>
                          {artists.map((artist: any) => {
                            const artistId = artist.id ?? artist.user?.id ?? artist.user_id;
                            const artistImageUrl = artist.user?.profile_picture_url || artist.image_url;
                            const artistBlurHash = artist.user?.pfp_blurhash;
                            const artistName = artist.display_name || artist.name || "Artist";

                            return (
                              <Link key={artistId || artistName} to={artistId ? `/artists/${artistId}` : "#"} className={homeStyles.itemsGrid}>
                                <LazyImg
                                  src={artistImageUrl || artistPlaceholder}
                                  blurHash={artistBlurHash}
                                  alt={artistName}
                                  imgClassNames={[styles.artistImage]}
                                />
                                <div className={homeStyles.songInfo}>
                                  <h3 className={homeStyles.songTitle}>{artistName}</h3>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {albums && albums.length > 0 && (
                      <section className={homeStyles.section}>
                        <div className={homeStyles.sectionHeader}>
                          <h2 className={homeStyles.sectionTitle}>Albums</h2>
                        </div>
                        <div className={homeStyles.cardsContainer}>
                          {albums.map((album: any) => {
                            const albumId = album.id;
                            return (
                              <Link key={albumId || album.title} to={albumId ? `/albums/${albumId}` : "#"} className={homeStyles.itemsGrid}>
                                <LazyImg
                                  src={album.image_url || ""}
                                  alt={album.title}
                                  imgClassNames={[styles.albumImage]}
                                />
                                <div className={homeStyles.songInfo}>
                                  <h3 className={homeStyles.songTitle}>{album.title}</h3>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {playlists && playlists.length > 0 && (
                      <section className={homeStyles.section}>
                        <div className={homeStyles.sectionHeader}>
                          <h2 className={homeStyles.sectionTitle}>Playlists</h2>
                        </div>
                        <div className={homeStyles.cardsContainer}>
                          {playlists.map((pl: any) => {
                            const playlistId = pl.id;
                            return (
                              <Link key={playlistId || pl.title} to={playlistId ? `/playlists/${playlistId}` : "#"} className={homeStyles.itemsGrid}>
                                <div className={styles.card}>
                                  <LazyImg
                                    src={pl.image_url || ""}
                                    alt={pl.title}
                                    imgClassNames={[styles.playlistImage]}
                                  />
                                  <div>
                                    <h3 className={homeStyles.itemTitle}>{pl.title}</h3>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </>
    );
}