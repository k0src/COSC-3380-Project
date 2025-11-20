import { memo, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { LazyImg } from "@components";
import styles from "./ArtistLayoutSidebar.module.css";
import {
  LuListMusic,
  LuLogOut,
  LuChevronRight,
  LuHouse,
  LuPlus,
  LuChartLine,
  LuMessageSquare,
} from "react-icons/lu";
import Logo from "@assets/logo.svg?react";

export interface ArtistLayoutSidebarProps {
  artistName: string;
  artistImageUrl: string;
}

const ArtistLayoutSidebar: React.FC<ArtistLayoutSidebarProps> = ({
  artistName,
  artistImageUrl,
}) => {
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
        <div className={styles.artistLinkContainer}>
          <LazyImg
            src={artistImageUrl}
            alt="Artist Profile"
            imgClassNames={[styles.artistProfileImg]}
            blurHash={user?.pfp_blurhash}
          />

          <div className={styles.artistNameContainer}>
            <span className={styles.artistName}>{artistName}</span>
            <Link
              className={styles.artistPageLink}
              to={`/artists/${user?.artist_id}`}
            >
              View Artist Page <LuChevronRight />
            </Link>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <NavLink
            to="/artist-dashboard/overview"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuHouse className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Overview</span>
          </NavLink>
          <NavLink
            to="/artist-dashboard/add"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuPlus className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Add New Content</span>
          </NavLink>
          <NavLink
            to="/artist-dashboard/manage"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuListMusic className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Manage Uploads</span>
          </NavLink>
          <NavLink
            to="/artist-dashboard/stats"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuChartLine className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Listeners & Stats</span>
          </NavLink>
          <NavLink
            to="/artist-dashboard/comments"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuMessageSquare className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Comments</span>
          </NavLink>
        </nav>
      </div>
      <div className={styles.sidebarBottom}>
        <div className={styles.sidebarLogo}>
          <Logo className={styles.logoImage} />
          <span className={styles.logoText}>Artists</span>
        </div>
        {isAuthenticated && (
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LuLogOut className={styles.sidebarIcon} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default memo(ArtistLayoutSidebar);
