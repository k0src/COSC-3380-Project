import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import styles from "./MainLayoutSidebar.module.css";
import logo from "@assets/logo.svg";
import {
  LuListMusic,
  LuLibrary,
  LuDisc3,
  LuUserPen,
  LuHistory,
  LuLogOut,
  LuUpload,
} from "react-icons/lu";

const MainLayoutSidebar: React.FC = () => {
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, navigate]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <div className={styles.sidebarLogo}>
          <img src={logo} alt="Logo" className={styles.logoImage} />
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
          <Link to="/library/history" className={styles.sidebarLink}>
            <LuHistory className={styles.sidebarIcon} />
          </Link>
          {user && user.role === "ARTIST" && (
            <>
              <Link to="/artist/dashboard" className={styles.sidebarLink}>
                <LuUserPen className={styles.sidebarIcon} />
              </Link>
              <Link to="/upload" className={styles.sidebarLink}>
                <LuUpload className={styles.sidebarIcon} />
              </Link>
            </>
          )}
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

export default MainLayoutSidebar;
