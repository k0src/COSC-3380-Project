import { memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { isWeb } from "@util";
import styles from "./MainLayoutSidebar.module.css";
import Logo from "@assets/logo.svg?react";
import {
  LuListMusic,
  LuLibrary,
  LuDisc3,
  LuUserPen,
  LuHistory,
  LuLogOut,
  LuUpload,
  LuAppWindowMac,
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

  const handleDownloadApp = useCallback(() => {
    window.open(
      "https://github.com/k0src/COSC-3380-Project/releases/latest",
      "_blank"
    );
  }, []);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <div className={styles.sidebarLogo}>
          <Logo className={styles.logoImage} />
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
          <Link to="/history" className={styles.sidebarLink}>
            <LuHistory className={styles.sidebarIcon} />
          </Link>
          {user && user.role === "ARTIST" && (
            <>
              <Link
                to="/artist-dashboard/overview"
                className={styles.sidebarLink}
              >
                <LuUserPen className={styles.sidebarIcon} />
              </Link>
              <Link to="/artist-dashboard/add" className={styles.sidebarLink}>
                <LuUpload className={styles.sidebarIcon} />
              </Link>
            </>
          )}
          {user && user.role === "ADMIN" && (
            <Link to="/Admin" className={styles.sidebarLink}>
              <LuUserPen className={styles.sidebarIcon} />
            </Link>
          )}
        </nav>
      </div>
      <div className={styles.sidebarBottom}>
        {isWeb && (
          <button onClick={handleDownloadApp} className={styles.logoutButton}>
            <LuAppWindowMac className={styles.sidebarIcon} />
          </button>
        )}
        {isAuthenticated && (
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LuLogOut className={styles.sidebarIcon} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default memo(MainLayoutSidebar);
