import { memo, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth, useContextMenu } from "@contexts";
import type {
  ContextMenuAction,
  ContextMenuEntity,
  ContextMenuEntityType,
} from "@contexts";
import type { LibraryPlaylist } from "@types";
import {
  LibraryRecent,
  LibraryPlaylists,
  LibrarySongs,
  LibraryAlbums,
  LibraryArtists,
  CreatePlaylistModal,
  ConfirmationModal,
} from "@components";
import { libraryApi, playlistApi } from "@api";
import styles from "./LibraryPage.module.css";
import classNames from "classnames";
import {
  LuDisc3,
  LuDiscAlbum,
  LuHistory,
  LuListMusic,
  LuMicVocal,
  LuLock,
  LuPlus,
  LuSearch,
  LuX,
  LuPin,
  LuPencil,
  LuTrash,
} from "react-icons/lu";

type TabType = "recent" | "playlists" | "songs" | "albums" | "artists";

const VALID_TABS = [
  "recent",
  "playlists",
  "songs",
  "albums",
  "artists",
] as const;

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

const LibraryPage: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistModalMode, setPlaylistModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [playlistToEdit, setPlaylistToEdit] = useState<LibraryPlaylist | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] =
    useState<LibraryPlaylist | null>(null);
  const { setCustomActionsProvider } = useContextMenu();

  const playlistsRefetchRef = useRef<(() => void) | null>(null);
  const recentRefetchRef = useRef<(() => void) | null>(null);

  const isValidTab = (tab: string | undefined): tab is TabType => {
    return VALID_TABS.includes(tab as TabType);
  };

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return isValidTab(tab) ? tab : "recent";
  });
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (isValidTab(tab)) {
      setActiveTab(tab);
      setSearchText("");
    } else if (!tab) {
      setActiveTab("recent");
    }
  }, [tab]);

  const tabs = useMemo(
    () => [
      { id: "recent" as const, icon: LuHistory, label: "Recent" },
      { id: "playlists" as const, icon: LuListMusic, label: "Playlists" },
      { id: "songs" as const, icon: LuDisc3, label: "Songs" },
      { id: "albums" as const, icon: LuDiscAlbum, label: "Albums" },
      { id: "artists" as const, icon: LuMicVocal, label: "Artists" },
    ],
    []
  );

  const handleTabClick = useCallback(
    (tab: TabType) => {
      navigate(`/library/${tab}`);
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

  const handleCreatePlaylist = useCallback(() => {
    setPlaylistToEdit(null);
    setPlaylistModalMode("create");
    setIsPlaylistModalOpen(true);
  }, []);

  const handlePlaylistCreated = useCallback(() => {
    playlistsRefetchRef.current?.();
    recentRefetchRef.current?.();
  }, []);

  const handlePinPlaylist = useCallback(
    async (playlist: LibraryPlaylist) => {
      if (!user?.id) return;

      try {
        await libraryApi.togglePinPlaylist(user.id, playlist.id);
        playlistsRefetchRef.current?.();
        recentRefetchRef.current?.();
      } catch (error) {
        console.error("Error toggling playlist pin:", error);
      }
    },
    [user?.id]
  );

  const handleEditPlaylist = useCallback((playlist: LibraryPlaylist) => {
    setPlaylistToEdit(playlist);
    setPlaylistModalMode("edit");
    setIsPlaylistModalOpen(true);
  }, []);

  const handleTogglePrivacy = useCallback(
    async (playlist: LibraryPlaylist) => {
      if (!user?.id || playlist.created_by !== user.id) return;

      try {
        await playlistApi.update(playlist.id, {
          is_public: !playlist.is_public,
        });
        playlistsRefetchRef.current?.();
        recentRefetchRef.current?.();
      } catch (error) {
        console.error("Error toggling playlist privacy:", error);
      }
    },
    [user?.id]
  );

  const handleDeletePlaylist = useCallback(
    (playlist: LibraryPlaylist) => {
      if (!user?.id || playlist.created_by !== user.id) return;

      setPlaylistToDelete(playlist);
      setIsDeleteModalOpen(true);
    },
    [user?.id]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!playlistToDelete) return;

    try {
      await playlistApi.delete(playlistToDelete.id);
      playlistsRefetchRef.current?.();
      recentRefetchRef.current?.();
      setIsDeleteModalOpen(false);
      setPlaylistToDelete(null);
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  }, [playlistToDelete]);

  const customActionsProvider = useCallback(
    (
      entity: ContextMenuEntity | null,
      entityType: ContextMenuEntityType | null
    ): ContextMenuAction[] => {
      const playlist = entity as LibraryPlaylist;
      const isOwner = user?.id === playlist.created_by;

      return [
        {
          id: "create-playlist",
          label: "Create Playlist",
          icon: LuListMusic,
          onClick: handleCreatePlaylist,
          show: true,
        },
        {
          id: "pin-playlist",
          label: playlist.is_pinned ? "Unpin Playlist" : "Pin Playlist",
          icon: LuPin,
          onClick: () => handlePinPlaylist(playlist),
          show: entityType === "playlist",
        },
        {
          id: "toggle-playlist-privacy",
          label: playlist.is_public ? "Make Private" : "Make Public",
          icon: LuLock,
          onClick: () => handleTogglePrivacy(playlist),
          show: entityType === "playlist" && isOwner,
        },
        {
          id: "edit-playlist",
          label: "Edit Details",
          icon: LuPencil,
          onClick: () => handleEditPlaylist(playlist),
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
    [
      user?.id,
      handleCreatePlaylist,
      handlePinPlaylist,
      handleEditPlaylist,
      handleTogglePrivacy,
      handleDeletePlaylist,
    ]
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

  return (
    <>
      <Helmet>
        <title>My Library - CoogMusic</title>
      </Helmet>

      <div className={styles.libraryLayout}>
        <span className={styles.libraryTitle}>My Library</span>

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
              className={styles.createPlaylistButton}
              onClick={handleCreatePlaylist}
            >
              <LuPlus /> Create Playlist
            </button>
          </div>
        </div>

        {activeTab === "recent" && (
          <LibraryRecent
            userId={user.id}
            maxItems={20}
            searchFilter={searchText}
            onRefetchNeeded={recentRefetchRef}
          />
        )}
        {activeTab === "playlists" && (
          <LibraryPlaylists
            userId={user.id}
            searchFilter={searchText}
            onRefetchNeeded={playlistsRefetchRef}
          />
        )}
        {activeTab === "songs" && (
          <LibrarySongs userId={user.id} searchFilter={searchText} />
        )}
        {activeTab === "albums" && (
          <LibraryAlbums userId={user.id} searchFilter={searchText} />
        )}
        {activeTab === "artists" && (
          <LibraryArtists userId={user.id} searchFilter={searchText} />
        )}

        <Link className={styles.historyLink} to="/history">
          View Full History
        </Link>
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
          onPlaylistCreated={handlePlaylistCreated}
        />
      ) : (
        <CreatePlaylistModal
          mode="edit"
          userId={user.id}
          username={user.username}
          isOpen={isPlaylistModalOpen}
          onClose={() => {
            setIsPlaylistModalOpen(false);
            setPlaylistToEdit(null);
          }}
          onPlaylistCreated={handlePlaylistCreated}
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
    </>
  );
};

export default memo(LibraryPage);
