import { memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { useAuth } from "@contexts";
import { useAsyncData } from "@hooks";
import { artistApi } from "@api";
import { LazyImg } from "@components";
import styles from "./ArtistLayoutSidebar.module.css";
import {
  LuListMusic,
  LuLibrary,
  LuDisc3,
  LuUserPen,
  LuHistory,
  LuLogOut,
  LuUpload,
  LuChevronRight,
} from "react-icons/lu";
import Logo from "@assets/logo.svg?react";
import artistPlaceholder from "@assets/artist-placeholder.webp";

const ArtistLayoutSidebar: React.FC = () => {
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const artistId = user?.artist_id;

  const { data, loading } = useAsyncData(
    {
      artist: () => artistApi.getArtistById(artistId!),
    },
    [artistId!],
    {
      cacheKey: `artist_layout_${artistId}`,
      enabled: !!artistId,
    }
  );

  const artist = data?.artist;

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
            src={user?.profile_picture_url || artistPlaceholder}
            alt="Artist Profile"
            imgClassNames={[styles.artistProfileImg]}
            blurHash={user?.pfp_blurhash}
          />
          {loading ? (
            <div className={styles.loaderContainer}>
              <BarLoader color="var(--color-accent)" />
            </div>
          ) : (
            <div className={styles.artistNameContainer}>
              <span className={styles.artistName}>{artist?.display_name}</span>
              <Link
                className={styles.artistPageLink}
                to={`/artists/${user?.artist_id}`}
              >
                View Artist Page <LuChevronRight />
              </Link>
            </div>
          )}
        </div>
        <nav className={styles.sidebarNav}>
          <Link to="/artist-dashboard/???" className={styles.sidebarLink}>
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
              <Link to="/artist-dashboard" className={styles.sidebarLink}>
                <LuUserPen className={styles.sidebarIcon} />
              </Link>
              <Link to="/upload" className={styles.sidebarLink}>
                <LuUpload className={styles.sidebarIcon} />
              </Link>
            </>
          )}
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
