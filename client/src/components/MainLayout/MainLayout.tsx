import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import classNames from "classnames";
import { useAuth } from "../../contexts";
import styles from "./MainLayout.module.css";
import {
  LuHouse,
  LuRss,
  LuSearch,
  LuBell,
  LuSettings,
  LuCircleUser,
  LuListMusic,
  LuLibrary,
  LuDisc3,
  LuUserPen,
  LuHistory,
  LuCirclePlay,
  LuCirclePause,
  LuRepeat,
  LuSkipBack,
  LuSkipForward,
  LuShuffle,
  LuVolume2,
  LuThumbsUp,
  LuListPlus,
  LuLogOut,
  LuShare,
} from "react-icons/lu";

const Sidebar: React.FC = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <div className={styles.sidebarLogo}>
          <img src="/logo.svg" alt="Logo" className={styles.logoImage} />
        </div>
        <nav className={styles.sidebarNav}>
          <Link to="/library" className={styles.sidebarLink}>
            <LuLibrary className={styles.sidebarIcon} />
          </Link>
          <Link to="/library/playlists" className={styles.sidebarLink}>
            <LuListMusic className={styles.sidebarIcon} />
          </Link>
          <Link to="/library/songs" className={styles.sidebarLink}>
            <LuDisc3 className={styles.sidebarIcon} />
          </Link>
          <Link to="/artist/dashboard" className={styles.sidebarLink}>
            <LuUserPen className={styles.sidebarIcon} />
          </Link>
          <Link to="/library/history" className={styles.sidebarLink}>
            <LuHistory className={styles.sidebarIcon} />
          </Link>
        </nav>
      </div>
      {isAuthenticated && (
        <button onClick={handleLogout} className={styles.logoutButton}>
          <LuLogOut className={styles.sidebarIcon} />
        </button>
      )}
    </aside>
  );
};

const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className={styles.header}>
      <nav className={styles.headerNav}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? styles.navbarLinkActive : styles.navbarLink
          }
        >
          <LuHouse className={styles.navIcon} />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            isActive ? styles.navbarLinkActive : styles.navbarLink
          }
        >
          <LuRss className={styles.navIcon} />
          <span>Feed</span>
        </NavLink>
      </nav>

      <div className={styles.searchContainer}>
        <LuSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search for songs, artist, albums, playlists..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.headerActions}>
        {isAuthenticated ? (
          <>
            <div
              className={classNames(
                styles.iconButton,
                styles.notificationButton
              )}
            >
              <LuBell className={styles.actionIcon} />
            </div>
            <Link to="/settings" className={styles.iconButton}>
              <LuSettings className={styles.actionIcon} />
            </Link>
            <Link to="/me" className={styles.iconButton} title={user?.username}>
              <LuCircleUser className={styles.actionIcon} />
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.navbarLink}>
              <span>Sign In</span>
            </Link>
            <Link to="/signup" className={styles.navbarLink}>
              <span>Sign Up</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

const NowPlayingBar: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime] = useState(38);
  const [duration] = useState(181);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleLike = async () => {
    try {
      if (isAuthenticated) {
        setIsLiked((prev) => !prev);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Toggling like failed:", error);
    }
  };

  const handleAddToPlaylist = async () => {
    try {
      if (isAuthenticated) {
        console.log("added to playlist");
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding to playlist failed:", error);
    }
  };

  return (
    <div className={styles.nowPlayingBar}>
      <div className={styles.nowPlayingInfo}>
        <img
          src="/placeholder.jpg"
          alt="Album Art"
          className={styles.albumArt}
        />
        <div className={styles.songInfo}>
          <Link to="/artist/123" className={styles.artistName}>
            Artist Name
          </Link>
          <Link to="/song/123" className={styles.songTitle}>
            Song Title
          </Link>
        </div>
      </div>

      <div className={styles.playerControls}>
        <div className={styles.controlButtons}>
          <button
            className={classNames(styles.controlButton, styles.shuffleButton, {
              [styles.controlButtonActive]: isShuffle,
            })}
            onClick={() => setIsShuffle(!isShuffle)}
          >
            <LuShuffle />
          </button>
          <button className={styles.controlButton}>
            <LuSkipBack />
          </button>
          <button
            className={classNames(styles.controlButton, styles.playButton, {
              [styles.playButtonActive]: isPlaying,
            })}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <LuCirclePause /> : <LuCirclePlay />}
          </button>
          <button className={styles.controlButton}>
            <LuSkipForward />
          </button>
          <button
            className={classNames(styles.controlButton, styles.repeatButton, {
              [styles.controlButtonActive]: isRepeat,
            })}
            onClick={() => setIsRepeat(!isRepeat)}
          >
            <LuRepeat />
          </button>
        </div>
        <div className={styles.progressContainer}>
          <span className={styles.timeLabel}>{formatTime(currentTime)}</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              className={styles.progressSlider}
              disabled
            />
          </div>
          <span className={styles.timeLabel}>{formatTime(duration)}</span>
        </div>
      </div>

      <div className={styles.rightControls}>
        <button
          className={classNames(styles.controlButton, {
            [styles.controlButtonActive]: isLiked,
          })}
          onClick={handleToggleLike}
        >
          <LuThumbsUp />
        </button>
        <button
          className={classNames(styles.controlButton, styles.playlistButton)}
          onClick={handleAddToPlaylist}
        >
          <LuListPlus />
        </button>
        <div className={styles.volumeControl}>
          <LuVolume2 className={styles.volumeIcon} />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className={styles.volumeSlider}
            style={{ "--volume-percent": `${volume}%` } as React.CSSProperties}
          />
        </div>
        <button
          className={classNames(styles.controlButton, styles.shareButton)}
        >
          <LuShare />
        </button>
      </div>
    </div>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className={styles.layoutContainer}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.contentArea}>{children}</main>
      </div>
      <NowPlayingBar />
    </div>
  );
};

export default MainLayout;
