import React from "react";
import styles from "./topBar.module.css"
;
const HomeButton = "../../../public/TopBar/HomeButton.svg";
const FeedButton = "../../../public/TopBar/FeedButton.svg";
const NotificationButton = "../../../public/TopBar/NotificationButton.svg";
const SettingButton = "../../../public/TopBar/SettingButton.svg";
const ProfileButton = "../../../public/TopBar/ProfileButton.svg";


const TopBar: React.FC = () => {
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