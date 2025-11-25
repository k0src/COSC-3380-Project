import { memo, useState, useMemo, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import type { AccessContext } from "@types";
import {
  AdminManageContentSongs,
  AdminManageContentAlbums,
  AdminManageContentPlaylists,
  AdminManageContentArtists,
} from "@components";
import styles from "./AdminManageContentPage.module.css";
import classNames from "classnames";
import { LuDisc3, LuDiscAlbum, LuListMusic, LuMic } from "react-icons/lu";

type TabType = "albums" | "songs" | "playlists" | "artists";
const VALID_TABS = ["albums", "songs", "playlists", "artists"] as const;

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

const AdminManageContentPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "owner",
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
      { id: "playlists" as const, icon: LuListMusic, label: "Playlists" },
      { id: "artists" as const, icon: LuMic, label: "Artists" },
    ],
    []
  );

  const handleTabClick = useCallback(
    (tab: TabType) => {
      navigate(`/admin/manage-content/${tab}`);
    },
    [navigate]
  );

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    navigate("/");
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Manage Content - Admin - CoogMusic</title>
      </Helmet>

      <div className={styles.manageLayout}>
        <span className={styles.manageTitle}>Manage Content</span>

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
          <AdminManageContentSongs accessContext={accessContext} />
        )}
        {activeTab === "albums" && (
          <AdminManageContentAlbums accessContext={accessContext} />
        )}
        {activeTab === "playlists" && (
          <AdminManageContentPlaylists accessContext={accessContext} />
        )}
        {activeTab === "artists" && (
          <AdminManageContentArtists accessContext={accessContext} />
        )}
      </div>
    </>
  );
};

export default memo(AdminManageContentPage);
