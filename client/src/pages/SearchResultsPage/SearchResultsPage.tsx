import { Helmet } from "react-helmet-async";
import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { searchApi } from "@api";
import type { SearchResults } from "@api/search.api";
import type { AccessContext } from "@types";
import { formatDateString, getMainArtist, pluralize } from "@util";
import { useAuth } from "@contexts";
import {
  UserItem,
  ArtistItem,
  PageLoader,
  EntityItemCard,
  ErrorPage,
  TopResultSection,
} from "@components";
import styles from "./SearchResultsPage.module.css";
import classNames from "classnames";
import {
  LuDisc3,
  LuDiscAlbum,
  LuList,
  LuListMusic,
  LuMicVocal,
  LuUserRound,
} from "react-icons/lu";
import musicPlaceholder from "@assets/music-placeholder.webp";

type TabType = "all" | "songs" | "albums" | "artists" | "playlists" | "users";

const TabButton = memo(
  ({
    tab,
    isActive,
    onClick,
    shouldShow,
  }: {
    tab: { id: TabType; icon: React.ElementType; label: string };
    isActive: boolean;
    onClick: (id: TabType) => void;
    shouldShow?: boolean;
  }) =>
    shouldShow === false ? null : (
      <button
        className={classNames(styles.switcherButton, {
          [styles.switcherButtonActive]: isActive,
        })}
        onClick={() => onClick(tab.id)}
      >
        <tab.icon /> {tab.label}
      </button>
    )
);

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { user } = useAuth();

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "globalList",
  };

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchApi.search(query, accessContext);
        setResults(data);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError("Failed to fetch search results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, accessContext.userId]);

  const tabs = useMemo(
    () => [
      { id: "all" as TabType, icon: LuList, label: "All" },
      { id: "songs" as TabType, icon: LuDisc3, label: "Songs" },
      { id: "albums" as TabType, icon: LuDiscAlbum, label: "Albums" },
      { id: "artists" as TabType, icon: LuMicVocal, label: "Artists" },
      { id: "playlists" as TabType, icon: LuListMusic, label: "Playlists" },
      { id: "users" as TabType, icon: LuUserRound, label: "Users" },
    ],
    []
  );

  const hasResults = useMemo(() => {
    return (
      results &&
      (results.songs.length > 0 ||
        results.albums.length > 0 ||
        results.artists.length > 0 ||
        results.playlists.length > 0 ||
        results.users.length > 0)
    );
  }, [results]);

  const totalResults = useMemo(() => {
    if (!results) return 0;
    return (
      results.songs.length +
      results.albums.length +
      results.artists.length +
      results.playlists.length +
      results.users.length
    );
  }, [results]);

  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <ErrorPage
        title="Error loading search results"
        message={
          error || "An unexpected error occurred. Please try again later."
        }
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{query ? `Search results for "${query}"` : "Search"}</title>
      </Helmet>

      <div className={styles.searchLayout}>
        <div className={styles.header}>
          <span className={styles.title}>
            {query ? `Search results for "${query}"` : "Search"}
          </span>
          <span className={styles.countText}>{`${totalResults} ${pluralize(
            totalResults,
            "result"
          )}`}</span>
        </div>

        <div className={styles.switcherContainer}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={handleTabClick}
              shouldShow={
                tab.id === "all"
                  ? true
                  : !!(results && results[tab.id] && results[tab.id].length > 0)
              }
            />
          ))}
        </div>

        {!hasResults || !results ? (
          <div className={styles.noResults}>No results found.</div>
        ) : (
          <>
            {activeTab === "all" && (
              <TopResultSection topResult={results.top_result} />
            )}

            {(activeTab === "all" || activeTab === "songs") &&
              (results?.songs?.length ?? 0) > 0 && (
                <div className={styles.resultsSection}>
                  <span className={styles.sectionTitle}>Songs</span>
                  <div className={styles.resultsGrid}>
                    {results.songs.map((song) => {
                      const mainArtist = getMainArtist(song.artists || []);

                      return (
                        <EntityItemCard
                          key={song.id}
                          entity={song}
                          type="song"
                          linkTo={`/songs/${song.id}`}
                          author={mainArtist?.display_name || "Unknown Artist"}
                          authorLinkTo={
                            mainArtist ? `/artists/${mainArtist.id}` : undefined
                          }
                          title={song.title}
                          subtitle={formatDateString(song.release_date)}
                          imageUrl={song.image_url || musicPlaceholder}
                          blurHash={song.image_url_blurhash}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

            {(activeTab === "all" || activeTab === "albums") &&
              (results?.albums?.length ?? 0) > 0 && (
                <div className={styles.resultsSection}>
                  <span className={styles.sectionTitle}>Albums</span>
                  <div className={styles.resultsGrid}>
                    {results.albums.map((album) => (
                      <EntityItemCard
                        key={album.id}
                        entity={album}
                        type="album"
                        linkTo={`/albums/${album.id}`}
                        author={album.artist?.display_name || "Unknown Artist"}
                        authorLinkTo={
                          album.artist
                            ? `/artists/${album.artist.id}`
                            : undefined
                        }
                        title={album.title}
                        subtitle={formatDateString(album.release_date)}
                        imageUrl={album.image_url || musicPlaceholder}
                        blurHash={album.image_url_blurhash}
                      />
                    ))}
                  </div>
                </div>
              )}

            {(activeTab === "all" || activeTab === "artists") &&
              (results?.artists?.length ?? 0) > 0 && (
                <div className={styles.resultsSection}>
                  <span className={styles.sectionTitle}>Artists</span>
                  <div className={styles.resultsGrid}>
                    {results.artists.map((artist) => (
                      <ArtistItem key={artist.id} artist={artist} size={18} />
                    ))}
                  </div>
                </div>
              )}

            {(activeTab === "all" || activeTab === "playlists") &&
              (results?.playlists?.length ?? 0) > 0 && (
                <div className={styles.resultsSection}>
                  <span className={styles.sectionTitle}>Playlists</span>
                  <div className={styles.resultsGrid}>
                    {results.playlists.map((playlist) => (
                      <EntityItemCard
                        key={playlist.id}
                        entity={playlist}
                        type="playlist"
                        linkTo={`/playlists/${playlist.id}`}
                        author={playlist.user?.username || "Unknown"}
                        authorLinkTo={
                          playlist.user?.id
                            ? `/users/${playlist.user.id}`
                            : undefined
                        }
                        title={playlist.title}
                        subtitle={`${playlist.song_count} songs`}
                        imageUrl={playlist.image_url || musicPlaceholder}
                        blurHash={playlist.image_url_blurhash}
                      />
                    ))}
                  </div>
                </div>
              )}

            {(activeTab === "all" || activeTab === "users") &&
              (results?.users?.length ?? 0) > 0 && (
                <div className={styles.resultsSection}>
                  <span className={styles.sectionTitle}>Users</span>
                  <div className={styles.resultsGrid}>
                    {results.users.map((user) => (
                      <UserItem key={user.id} user={user} size={18} />
                    ))}
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    </>
  );
};

export default memo(SearchResultsPage);
