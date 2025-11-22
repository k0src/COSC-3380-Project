import { memo, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth, useContextMenu } from "@contexts";
import type {
  ContextMenuAction,
  ContextMenuEntity,
  ContextMenuEntityType,
} from "@contexts";
import type { LibraryPlaylist, AccessContext } from "@types";
import {
  HistoryPlaylists,
  HistorySongs,
  HistoryAlbums,
  HistoryArtists,
  ConfirmationModal,
  CreatePlaylistModal,
} from "@components";
import { libraryApi, playlistApi } from "@api";
import { useStreamTracking } from "@hooks";
import styles from "./HistoryPage.module.css";
import classNames from "classnames";
import {
  LuDisc3,
  LuDiscAlbum,
  LuListMusic,
  LuMicVocal,
  LuLock,
  LuSearch,
  LuX,
  LuPencil,
  LuTrash,
  LuBrush,
} from "react-icons/lu";

type TabType = "playlists" | "songs" | "albums" | "artists";
const VALID_TABS = ["playlists", "songs", "albums", "artists"] as const;

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
      className={classNames(styles.librarySwitcherButton, {
        [styles.librarySwitcherButtonActive]: isActive,
      })}
      onClick={() => onClick(tab.id)}
    >
      <tab.icon /> {tab.label}
    </button>
  )
);

const HistoryPage: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { setCustomActionsProvider } = useContextMenu();
  const { clearLocalHistory } = useStreamTracking();
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistModalMode, setPlaylistModalMode] = useState<"create" | "edit">(
    "edit"
  );
  const [playlistToEdit, setPlaylistToEdit] = useState<LibraryPlaylist | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] =
    useState<LibraryPlaylist | null>(null);

  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  const playlistsRefetchRef = useRef<(() => void) | null>(null);

  const isValidTab = (tab: string | undefined): tab is TabType => {
    return VALID_TABS.includes(tab as TabType);
  };
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return isValidTab(tab) ? tab : "songs";
  });
  const [searchText, setSearchText] = useState("");

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
      { id: "playlists" as const, icon: LuListMusic, label: "Playlists" },
      { id: "albums" as const, icon: LuDiscAlbum, label: "Albums" },
      { id: "artists" as const, icon: LuMicVocal, label: "Artists" },
    ],
    []
  );

  const handleTabClick = useCallback(
    (tab: TabType) => {
      navigate(`/history/${tab}`);
    },
    [navigate]
  );

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

  const handleEditPlaylist = useCallback((playlist: LibraryPlaylist) => {
    setPlaylistToEdit(playlist);
    setPlaylistModalMode("edit");
    setIsPlaylistModalOpen(true);
  }, []);

  const handleConfirmClearHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      await libraryApi.clearHistory(user.id);
      clearLocalHistory();
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  }, [user?.id, clearLocalHistory]);

  const handleClearHistory = useCallback(() => {
    setIsClearHistoryModalOpen(true);
  }, []);

  const handleDeletePlaylist = useCallback(
    (playlist: LibraryPlaylist) => {
      if (!user?.id || playlist.owner_id !== user.id) return;

      setPlaylistToDelete(playlist);
      setIsDeleteModalOpen(true);
    },
    [user?.id]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!playlistToDelete) return;

    try {
      await playlistApi.delete(playlistToDelete.id);
      setIsDeleteModalOpen(false);
      setPlaylistToDelete(null);
      playlistsRefetchRef.current?.();
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  }, [playlistToDelete]);

  const handleTogglePrivacy = useCallback(
    async (playlist: LibraryPlaylist) => {
      if (!user?.id || playlist.owner_id !== user.id) return;

      try {
        await playlistApi.update(playlist.id, {
          visibility_status:
            playlist.visibility_status === "PUBLIC" ? "PRIVATE" : "PUBLIC",
        });

        playlistsRefetchRef.current?.();
      } catch (error) {
        console.error("Error toggling playlist privacy:", error);
      }
    },
    [user?.id]
  );

  const customActionsProvider = useCallback(
    (
      entity: ContextMenuEntity | null,
      entityType: ContextMenuEntityType | null
    ): ContextMenuAction[] => {
      const playlist = entity as LibraryPlaylist;
      const isOwner = user?.id === playlist.owner_id;

      return [
        {
          id: "edit-playlist",
          label: "Edit Details",
          icon: LuPencil,
          onClick: () => handleEditPlaylist(playlist),
          show: entityType === "playlist" && isOwner,
        },
        {
          id: "toggle-playlist-privacy",
          label:
            playlist.visibility_status === "PUBLIC"
              ? "Make Private"
              : "Make Public",
          icon: LuLock,
          onClick: () => handleTogglePrivacy(playlist),
          show: entityType === "playlist" && isOwner,
        },
        {
          id: "delete-playlist",
          label: "Delete Playlist",
          icon: LuTrash,
          onClick: () => handleDeletePlaylist(playlist),
          show: entityType === "playlist" && isOwner,
        },
      ];
    },
    [user?.id, handleEditPlaylist, handleDeletePlaylist, handleTogglePrivacy]
  );

  useEffect(() => {
    setCustomActionsProvider(customActionsProvider);
    return () => {
      setCustomActionsProvider(null);
    };
  }, [customActionsProvider, setCustomActionsProvider]);

  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  const accessContext: AccessContext = {
    role: user.role === "ADMIN" ? "admin" : "user",
    userId: user.id,
    scope: "ownerList",
  };

  return (
    <>
      <Helmet>
        <title>History - CoogMusic</title>
      </Helmet>

      <div className={styles.libraryLayout}>
        <span className={styles.libraryTitle}>History</span>

        <div className={styles.libraryActions}>
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
              className={styles.clearHistoryButton}
              onClick={handleClearHistory}
            >
              <LuBrush /> Clear History
            </button>
          </div>
        </div>

        {activeTab === "playlists" && (
          <HistoryPlaylists
            userId={user.id}
            searchFilter={searchText}
            onRefetchNeeded={playlistsRefetchRef}
            accessContext={accessContext}
          />
        )}
        {activeTab === "songs" && (
          <HistorySongs
            userId={user.id}
            searchFilter={searchText}
            accessContext={accessContext}
          />
        )}
        {activeTab === "albums" && (
          <HistoryAlbums
            userId={user.id}
            searchFilter={searchText}
            accessContext={accessContext}
          />
        )}
        {activeTab === "artists" && (
          <HistoryArtists userId={user.id} searchFilter={searchText} />
        )}
      </div>

      {playlistModalMode === "create" ? (
        <CreatePlaylistModal
          userId={user.id}
          username={user.username}
          isOpen={isPlaylistModalOpen}
          onClose={() => {
            setIsPlaylistModalOpen(false);
            setPlaylistToEdit(null);
          }}
          onPlaylistCreated={() => {
            playlistsRefetchRef.current?.();
          }}
        />
      ) : (
        <CreatePlaylistModal
          mode="edit"
          isOpen={isPlaylistModalOpen}
          onClose={() => {
            setIsPlaylistModalOpen(false);
            setPlaylistToEdit(null);
          }}
          onPlaylistCreated={() => {
            playlistsRefetchRef.current?.();
          }}
          playlist={playlistToEdit!}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPlaylistToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${playlistToDelete?.title}"? This action cannot be undone.`}
        confirmButtonText="Delete Playlist"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isClearHistoryModalOpen}
        onClose={() => {
          setIsClearHistoryModalOpen(false);
        }}
        onConfirm={handleConfirmClearHistory}
        title="Clear History"
        message="Are you sure you want to clear your history? This action cannot be undone."
        confirmButtonText="Clear History"
      />
    </>
  );
};

export default memo(HistoryPage);
