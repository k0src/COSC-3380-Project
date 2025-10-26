import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./topBar.module.css";
const HomeButton = "/TopBar/HomeButton.svg";
const FeedButton = "/TopBar/FeedButton.svg";
const NotificationButton = "/TopBar/NotificationButton.svg";
const SettingButton = "/TopBar/SettingButton.svg";
const ProfileButton = "/TopBar/ProfileButton.svg";


const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState<string>(searchParams.get("q") ?? "");

  // Keep input in sync when query param changes (e.g., via navigation)
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  const submitSearch = () => {
    const q = search.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitSearch();
    }
  };

  return (
    <header className={styles.topBarContainer}>
      {/*  Navigation Buttons  */}
      <div className={styles.topBarNav}>
        <button className={styles.navButton}>
          <img src={HomeButton} alt="Home" className={styles.navIcon} />
          <span className={styles.navText}>Home</span>
        </button>

        <button className={styles.navButton}>
          <img src={FeedButton} alt="Feed" className={styles.navIcon} />
          <span className={styles.navText}>Feed</span>
        </button>
      </div>

      {/* Search Bar  */}
      <div className={styles.searchContainer}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search for songs, artists, albums, playlists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>

      {/* Profile, Settings, Notifications */}
      <div className={styles.rightSection}>
        <button className={styles.navButton}>
          <img src={NotificationButton} alt="Notification" className={styles.navIcon} />
        </button>

        <button className={styles.navButton}>
          <img src={SettingButton} alt="Settings" className={styles.navIcon} />
        </button>

        <button className={styles.navButton}>
          <img src={ProfileButton} alt="Profile" className={styles.navIcon} />
        </button>
      </div>
    </header>
  );
};
export default TopBar;