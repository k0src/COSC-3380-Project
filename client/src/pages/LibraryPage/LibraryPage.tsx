import { memo, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@contexts";
import {
  LibraryRecent,
  LibraryPlaylists,
  LibrarySongs,
  LibraryAlbums,
  LibraryArtists,
} from "@components";
import styles from "./LibraryPage.module.css";
import classNames from "classnames";
import {
  LuDisc3,
  LuDiscAlbum,
  LuHistory,
  LuListMusic,
  LuMicVocal,
  LuPlus,
  LuSearch,
  LuX,
} from "react-icons/lu";

type TabType = "recent" | "playlists" | "songs" | "albums" | "artists";

const LibraryPage: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [searchText, setSearchText] = useState("");

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (
      tab === "recent" ||
      tab === "playlists" ||
      tab === "songs" ||
      tab === "albums" ||
      tab === "artists"
    )
      return tab;
    return "recent";
  });

  useEffect(() => {
    if (
      tab === "recent" ||
      tab === "playlists" ||
      tab === "songs" ||
      tab === "albums" ||
      tab === "artists"
    ) {
      setActiveTab(tab);
    } else if (!tab) {
      setActiveTab("recent");
    }
  }, [tab]);

  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  const handleTabClick = useCallback(
    (tab: TabType) => {
      navigate(`/library/${tab}`);
      setActiveTab(tab);
    },
    [navigate]
  );

  const handleCreatePlaylist = useCallback(() => {
    navigate("/library/playlists/create");
  }, [navigate]);

  const handleClearFilter = useCallback(() => {
    setSearchText("");
  }, []);

  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchText(value);
    },
    []
  );

  return (
    <>
      <Helmet>
        <title>My Library</title>
      </Helmet>

      <div className={styles.libraryLayout}>
        <span className={styles.libraryTitle}>My Library</span>

        <div className={styles.libraryActions}>
          <div className={styles.switcherContainer}>
            <button
              className={classNames(styles.librarySwitcherButton, {
                [styles.librarySwitcherButtonActive]: activeTab === "recent",
              })}
              onClick={() => handleTabClick("recent")}
            >
              <LuHistory /> Recent
            </button>
            <button
              className={classNames(styles.librarySwitcherButton, {
                [styles.librarySwitcherButtonActive]: activeTab === "playlists",
              })}
              onClick={() => handleTabClick("playlists")}
            >
              <LuListMusic /> Playlists
            </button>
            <button
              className={classNames(styles.librarySwitcherButton, {
                [styles.librarySwitcherButtonActive]: activeTab === "songs",
              })}
              onClick={() => handleTabClick("songs")}
            >
              <LuDisc3 /> Songs
            </button>
            <button
              className={classNames(styles.librarySwitcherButton, {
                [styles.librarySwitcherButtonActive]: activeTab === "albums",
              })}
              onClick={() => handleTabClick("albums")}
            >
              <LuDiscAlbum /> Albums
            </button>
            <button
              className={classNames(styles.librarySwitcherButton, {
                [styles.librarySwitcherButtonActive]: activeTab === "artists",
              })}
              onClick={() => handleTabClick("artists")}
            >
              <LuMicVocal /> Artists
            </button>
          </div>

          <div className={styles.libraryActionsRight}>
            <div className={styles.searchContainer}>
              <LuSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search..."
                className={styles.searchInput}
                aria-label="Search"
                value={searchText}
                onChange={(e) => handleFilterChange(e)}
              />
              <LuX className={styles.searchClear} onClick={handleClearFilter} />
            </div>
            <button
              className={styles.createPlaylistButton}
              onClick={handleCreatePlaylist}
            >
              <LuPlus /> Create Playlist
            </button>
          </div>
        </div>

        {activeTab === "recent" && (
          <LibraryRecent userId={user.id} maxItems={20} />
        )}
        {activeTab === "playlists" && <LibraryPlaylists userId={user.id} />}
        {activeTab === "songs" && <LibrarySongs userId={user.id} />}
        {activeTab === "albums" && <LibraryAlbums userId={user.id} />}
        {activeTab === "artists" && <LibraryArtists userId={user.id} />}
      </div>
    </>
  );
};

export default memo(LibraryPage);
