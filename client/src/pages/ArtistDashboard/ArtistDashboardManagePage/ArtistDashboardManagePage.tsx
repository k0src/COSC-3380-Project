import { memo, useState, useMemo, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import type { AccessContext } from "@types";
import {
  ArtistDashboardManageSongs,
  ArtistDashboardManageAlbums,
  ArtistDashboardManagePlaylists,
} from "@components";
import styles from "./ArtistDashboardManagePage.module.css";
import classNames from "classnames";
import { LuDisc3, LuDiscAlbum, LuListMusic } from "react-icons/lu";

type TabType = "albums" | "songs" | "playlists";
const VALID_TABS = ["albums", "songs", "playlists"] as const;

const TabButton = memo(
  ({
    tab,
    isActive,
    onClick,
  }: {
    tab: { id: TabType; icon: React.ElementType; label: string };
    isActive: boolean;
    onClick: (id: TabType) => void;
  }) => (
    <button
      className={classNames(styles.manageSwitcherButton, {
        [styles.manageSwitcherButtonActive]: isActive,
      })}
      onClick={() => onClick(tab.id)}
    >
      <tab.icon /> {tab.label}
    </button>
  )
);

const ArtistDashboardManagePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "ownerList",
  };

  const isValidTab = (tab: string | undefined): tab is TabType => {
    return VALID_TABS.includes(tab as TabType);
  };

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return isValidTab(tab) ? tab : "songs";
  });

  useEffect(() => {
    if (isValidTab(tab)) {
      setActiveTab(tab);
    } else if (!tab) {
      setActiveTab("songs");
    }
  }, [tab]);

  const tabs = useMemo(
    () => [
      { id: "songs" as const, icon: LuDisc3, label: "Songs" },
      { id: "albums" as const, icon: LuDiscAlbum, label: "Albums" },
      {
        id: "playlists" as const,
        icon: LuListMusic,
        label: "Artist Playlists",
      },
    ],
    []
  );

  const handleTabClick = useCallback(
    (tab: TabType) => {
      navigate(`/artist-dashboard/manage/${tab}`);
    },
    [navigate]
  );

  if (!isAuthenticated || !user || !user.artist_id) {
    navigate("/login");
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Manage Content - CoogMusic</title>
      </Helmet>

      <div className={styles.manageLayout}>
        <header className={styles.manageHeader}>
          <span className={styles.manageTitle}>Manage Content</span>
          <span className={styles.manageSubtitle}>
            Manage your songs, albums, and artist playlists.
          </span>
        </header>

        <div className={styles.switcherContainer}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={handleTabClick}
            />
          ))}
        </div>

        {activeTab === "songs" && (
          <ArtistDashboardManageSongs
            artistId={user.artist_id}
            userId={user.id}
            accessContext={accessContext}
          />
        )}
        {activeTab === "albums" && (
          <ArtistDashboardManageAlbums
            artistId={user.artist_id}
            accessContext={accessContext}
          />
        )}
        {activeTab === "playlists" && (
          <ArtistDashboardManagePlaylists
            artistId={user.artist_id}
            accessContext={accessContext}
          />
        )}
      </div>
    </>
  );
};

export default memo(ArtistDashboardManagePage);
