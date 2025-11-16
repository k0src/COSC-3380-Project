import { memo, useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContextMenu } from "@contexts";
import { useAudioQueue, useAuth } from "@contexts";
import { useLikeStatus, useFollowStatus } from "@hooks";
import type { Song, Playlist, Album, Artist } from "@types";
import PlaylistAddMenu from "./PlaylistAddMenu/PlaylistAddMenu";
import styles from "./ContextMenu.module.css";
import {
  LuPlay,
  LuListStart,
  LuListEnd,
  LuListPlus,
  LuThumbsUp,
  LuUserRoundPlus,
  LuShare,
} from "react-icons/lu";

const ContextMenu: React.FC = () => {
  const {
    state: menuState,
    closeContextMenu,
    openShareModal,
  } = useContextMenu();
  const { actions } = useAudioQueue();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false);
  const [playlistMenuPosition, setPlaylistMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  const { entity, entityType, x, y, isOpen, customActions } = menuState;

  const {
    isLiked,
    toggleLike,
    isLoading: isLikeLoading,
  } = useLikeStatus({
    userId: user?.id || "",
    entityId: entity?.id || "",
    entityType: entityType || "song",
    isAuthenticated: isAuthenticated && !!entity && entityType !== "artist",
  });

  const artistUserId =
    entityType === "artist" ? (entity as Artist)?.user_id || "" : "";

  const {
    isFollowed,
    toggleFollow,
    isLoading: isFollowLoading,
  } = useFollowStatus({
    userId: user?.id || "",
    followingUserId: artistUserId,
    isAuthenticated: isAuthenticated && !!artistUserId,
  });

  const { menuPosition } = useMemo(() => {
    if (!isOpen) {
      return { menuPosition: { top: 0, left: 0 } };
    }

    const menuWidth = 256;
    const computedMenuHeight = menuHeight || 400;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const spaceRight = windowWidth - x;
    const spaceBottom = windowHeight - y;
    const spaceLeft = x;
    const spaceTop = y;

    let top = y;
    let left = x;
    let corner = "";

    if (spaceRight >= menuWidth) {
      left = x;
      corner = "left";
    } else if (spaceLeft >= menuWidth) {
      left = x - menuWidth / 1.7;
      corner = "right";
    } else {
      left = Math.max(0, x - menuWidth / 2);
      corner = "center";
    }

    if (spaceBottom >= computedMenuHeight) {
      top = y;
      corner = `top-${corner}`;
    } else if (spaceTop >= computedMenuHeight) {
      top = y - computedMenuHeight;
      corner = `bottom-${corner}`;
    } else {
      top = Math.max(0, windowHeight - computedMenuHeight);
      corner = `middle-${corner}`;
    }

    return { menuPosition: { top, left } };
  }, [isOpen, x, y, menuHeight]);

  useEffect(() => {
    if (menuRef.current && isOpen) {
      setMenuHeight(menuRef.current.offsetHeight);
    }
  }, [isOpen, entity, entityType, customActions]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeContextMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeContextMenu]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
        setPlaylistMenuOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeContextMenu]);

  useEffect(() => {
    if (!isOpen) {
      setPlaylistMenuOpen(false);
    }
  }, [isOpen]);

  const handlePlay = useCallback(
    async (event?: React.MouseEvent) => {
      if (!entity) return;
      await actions.play(entity as Song | Playlist | Album);
      closeContextMenu();
    },
    [entity, actions, closeContextMenu]
  );

  const handleQueueNext = useCallback(
    async (event?: React.MouseEvent) => {
      if (!isAuthenticated) {
        navigate("/login");
        closeContextMenu();
        return;
      }

      if (!entity || !entityType) return;
      if (entityType === "song") {
        actions.queueNext(entity as Song);
      } else {
        await actions.queueListNext(entity as Playlist | Album);
      }
      closeContextMenu();
    },
    [entity, entityType, actions, closeContextMenu, isAuthenticated, navigate]
  );

  const handleQueueLast = useCallback(
    async (event?: React.MouseEvent) => {
      if (!isAuthenticated) {
        navigate("/login");
        closeContextMenu();
        return;
      }

      if (!entity || !entityType) return;
      if (entityType === "song") {
        actions.queueLast(entity as Song);
      } else {
        await actions.queueListLast(entity as Playlist | Album);
      }
      closeContextMenu();
    },
    [entity, entityType, actions, closeContextMenu, isAuthenticated, navigate]
  );

  const handleAddToPlaylist = useCallback(
    (event?: React.MouseEvent) => {
      if (!isAuthenticated) {
        navigate("/login");
        closeContextMenu();
        return;
      }

      if (!entity || entityType !== "song" || !event) return;

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const submenuX = rect.right + 8;
      const submenuY = rect.top;

      setPlaylistMenuPosition({ x: submenuX, y: submenuY });
      setPlaylistMenuOpen(true);
    },
    [entity, entityType, isAuthenticated, navigate, closeContextMenu]
  );

  const handleToggleLike = useCallback(
    async (event?: React.MouseEvent) => {
      if (!isAuthenticated) {
        navigate("/login");
        closeContextMenu();
        return;
      }
      try {
        await toggleLike();
        closeContextMenu();
      } catch (error) {
        console.error("Toggle like failed:", error);
      }
    },
    [isAuthenticated, navigate, toggleLike, closeContextMenu]
  );

  const handleToggleFollow = useCallback(
    async (event?: React.MouseEvent) => {
      if (!isAuthenticated) {
        navigate("/login");
        closeContextMenu();
        return;
      }
      try {
        await toggleFollow();
        closeContextMenu();
      } catch (error) {
        console.error("Toggle follow failed:", error);
      }
    },
    [isAuthenticated, navigate, toggleFollow, closeContextMenu]
  );

  const handleShare = useCallback(
    (event?: React.MouseEvent) => {
      if (!entity) return;

      const origin = window.location.origin;
      let url = "";
      let title = "";

      if (entityType === "song") {
        url = `${origin}/songs/${entity.id}`;
        title = (entity as Song).title;
      } else if (entityType === "album") {
        url = `${origin}/albums/${entity.id}`;
        title = (entity as Album).title;
      } else if (entityType === "playlist") {
        url = `${origin}/playlists/${entity.id}`;
        title = (entity as Playlist).title;
      } else if (entityType === "artist") {
        url = `${origin}/artists/${entity.id}`;
        title = (entity as Artist).display_name;
      }

      openShareModal(url, title);
      closeContextMenu();
    },
    [entity, entityType, openShareModal, closeContextMenu]
  );

  const actions_list = useMemo(() => {
    if (!entity || !entityType) return [];

    const list: Array<
      | {
          id: string;
          label: string;
          icon: React.ComponentType;
          onClick: (event?: React.MouseEvent) => void | Promise<void>;
          disabled?: boolean;
        }
      | "divider"
    > = [];

    if (
      entityType === "song" ||
      entityType === "album" ||
      entityType === "playlist"
    ) {
      list.push({
        id: "play",
        label: "Play",
        icon: LuPlay,
        onClick: handlePlay,
      });
    }

    if (
      entityType === "song" ||
      entityType === "album" ||
      entityType === "playlist"
    ) {
      list.push({
        id: "queue-next",
        label: "Queue Next",
        icon: LuListStart,
        onClick: handleQueueNext,
      });
    }

    if (
      entityType === "song" ||
      entityType === "album" ||
      entityType === "playlist"
    ) {
      list.push({
        id: "queue-last",
        label: "Queue Last",
        icon: LuListEnd,
        onClick: handleQueueLast,
      });
    }

    if (entityType === "song") {
      list.push({
        id: "add-to-playlist",
        label: "Add to Playlist",
        icon: LuListPlus,
        onClick: handleAddToPlaylist,
      });
    }

    if (customActions.length > 0) {
      const visibleCustomActions = customActions.filter((a) => a.show);
      if (visibleCustomActions.length > 0) {
        list.push("divider");
        visibleCustomActions.forEach((action) => {
          list.push({
            id: action.id,
            label: action.label,
            icon: action.icon,
            onClick: () => {
              action.onClick();
              closeContextMenu();
            },
          });
        });
      }
    }

    if (
      entityType === "song" ||
      entityType === "album" ||
      entityType === "playlist"
    ) {
      if (list.length > 0 && list[list.length - 1] !== "divider") {
        list.push("divider");
      }
      list.push({
        id: "toggle-like",
        label: isLiked ? "Unlike" : "Like",
        icon: LuThumbsUp,
        onClick: handleToggleLike,
        disabled: isLikeLoading,
      });
    }

    if (entityType === "artist") {
      list.push({
        id: "toggle-follow",
        label: isFollowed ? "Unfollow" : "Follow",
        icon: LuUserRoundPlus,
        onClick: handleToggleFollow,
        disabled: isFollowLoading,
      });
    }

    if (
      entityType === "song" ||
      entityType === "album" ||
      entityType === "artist" ||
      entityType === "playlist"
    ) {
      if (list.length > 0 && list[list.length - 1] !== "divider") {
        list.push("divider");
      }
      list.push({
        id: "share",
        label: "Share",
        icon: LuShare,
        onClick: handleShare,
      });
    }

    return list;
  }, [
    entity,
    entityType,
    user,
    isLiked,
    isFollowed,
    isLikeLoading,
    isFollowLoading,
    customActions,
    handlePlay,
    handleQueueNext,
    handleQueueLast,
    handleAddToPlaylist,
    handleToggleLike,
    handleToggleFollow,
    handleShare,
    closeContextMenu,
  ]);

  if (!isOpen || actions_list.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
      }}
    >
      {actions_list.map((action, index) => {
        if (action === "divider") {
          return <div key={`divider-${index}`} className={styles.divider} />;
        }

        const Icon = action.icon as React.ComponentType<{
          className?: string;
        }>;
        return (
          <button
            key={action.id}
            className={styles.menuItem}
            onClick={(e) => action.onClick(e)}
            disabled={action.disabled}
          >
            <Icon className={styles.menuIcon} />
            <span>{action.label}</span>
          </button>
        );
      })}

      <PlaylistAddMenu
        isOpen={playlistMenuOpen}
        position={playlistMenuPosition}
        songId={entity?.id || ""}
        onClose={() => {
          setPlaylistMenuOpen(false);
          closeContextMenu();
        }}
      />
    </div>
  );
};

export default memo(ContextMenu);
