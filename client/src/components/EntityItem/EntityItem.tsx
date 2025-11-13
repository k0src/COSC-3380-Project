import { memo, useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAudioQueue, useAuth, useContextMenu } from "@contexts";
import type { Song, Playlist, Album } from "@types";
import { QueueMenu, SoundVisualizer, LazyImg } from "@components";
import styles from "./EntityItem.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import artistPlaceholder from "@assets/artist-placeholder.webp";
import { LuPlay, LuPause, LuListEnd } from "react-icons/lu";
import classNames from "classnames";

interface EntityActionButtonsProps {
  type: "song" | "playlist" | "album" | "artist";
  entity?: Song | Playlist | Album;
  isHovered: boolean;
  isSmall: boolean;
}

const EntityActionButtons: React.FC<EntityActionButtonsProps> = memo(
  ({ type, entity, isHovered, isSmall }) => {
    const { state, actions } = useAudioQueue();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [queueMenuOpen, setQueueMenuOpen] = useState(false);
    const queueButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (!isHovered && queueMenuOpen) {
        setQueueMenuOpen(false);
      }
    }, [isHovered, queueMenuOpen]);

    const currentQueueItem = useMemo(() => {
      if (state.currentIndex < 0 || state.currentIndex >= state.queue.length) {
        return null;
      }
      return state.queue[state.currentIndex];
    }, [state.currentIndex, state.queue]);

    const isEntityPlaying = useMemo(() => {
      if (!entity || !currentQueueItem) return false;

      if (type === "song") {
        return currentQueueItem.song.id === (entity as Song).id;
      } else if (type === "playlist") {
        return (
          !currentQueueItem.isQueued &&
          currentQueueItem.sourceId === (entity as Playlist).id &&
          currentQueueItem.sourceType === "playlist"
        );
      } else if (type === "album") {
        return (
          !currentQueueItem.isQueued &&
          currentQueueItem.sourceId === (entity as Album).id &&
          currentQueueItem.sourceType === "album"
        );
      }
      return false;
    }, [entity, currentQueueItem, type]);

    const handlePlayPause = useCallback(() => {
      if (!entity) return;

      if (isEntityPlaying) {
        if (state.isPlaying) {
          actions.pause();
        } else {
          actions.resume();
        }
      } else {
        actions.play(entity);
      }
    }, [entity, isEntityPlaying, state.isPlaying, actions]);

    const handleAddToQueue = useCallback(async () => {
      try {
        if (isAuthenticated) {
          setQueueMenuOpen((prev) => !prev);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Adding to queue failed:", error);
      }
    }, [isAuthenticated, navigate]);

    if (isSmall) {
      return (
        <div className={styles.entityActionButtonContainer}>
          {type === "song" && (
            <div className={styles.queueButtonContainer}>
              <button
                ref={queueButtonRef}
                onClick={handleAddToQueue}
                className={styles.entityActionButton}
              >
                <LuListEnd />
              </button>
              <QueueMenu
                isOpen={queueMenuOpen}
                onClose={() => setQueueMenuOpen(false)}
                entity={entity as Song}
                entityType="song"
                buttonRef={queueButtonRef}
                justification="right"
              />
            </div>
          )}
          {(type === "song" || type === "playlist" || type === "album") && (
            <button
              onClick={handlePlayPause}
              className={classNames(styles.entityActionButton, {
                [styles.entityActionButtonActive]:
                  isEntityPlaying && state.isPlaying,
              })}
            >
              {isEntityPlaying && state.isPlaying ? <LuPause /> : <LuPlay />}
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={styles.entityActionButtonContainerWide}>
        {type === "song" && (
          <div className={styles.queueButtonContainer}>
            <button
              ref={queueButtonRef}
              onClick={handleAddToQueue}
              className={styles.entityActionButton}
            >
              <LuListEnd />
            </button>
            <QueueMenu
              isOpen={queueMenuOpen}
              onClose={() => setQueueMenuOpen(false)}
              entity={entity as Song}
              entityType="song"
              buttonRef={queueButtonRef}
              justification="right"
            />
          </div>
        )}
        {(type === "song" || type === "playlist" || type === "album") && (
          <button
            onClick={handlePlayPause}
            className={classNames(styles.entityActionButton, {
              [styles.entityActionButtonActive]:
                isEntityPlaying && state.isPlaying,
            })}
          >
            {isEntityPlaying && state.isPlaying ? <LuPause /> : <LuPlay />}
          </button>
        )}
      </div>
    );
  }
);

type EntityItemProps =
  | {
      type: "artist";
      linkTo: string;
      author?: string;
      authorLinkTo?: string;
      title: string;
      subtitle?: string;
      imageUrl?: string;
      blurHash?: string;
      entity?: never;
      isSmall?: boolean;
      index?: number;
    }
  | {
      type: "song" | "playlist" | "album";
      linkTo: string;
      author?: string;
      authorLinkTo?: string;
      title: string;
      subtitle?: string;
      imageUrl?: string;
      blurHash?: string;
      entity: Song | Playlist | Album;
      isSmall?: boolean;
      index?: number;
    };

const EntityItem: React.FC<EntityItemProps> = ({
  entity,
  imageUrl,
  blurHash,
  linkTo,
  author,
  authorLinkTo,
  title,
  subtitle,
  type,
  isSmall = true,
  index,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { state } = useAudioQueue();
  const { openContextMenu } = useContextMenu();

  const isCurrentSong =
    type === "song" && entity && state.currentSong?.id === (entity as Song).id;
  const showVisualizer = !isSmall && type === "song" && isCurrentSong;

  const imgSrc = useMemo(
    () =>
      imageUrl || (type === "artist" ? artistPlaceholder : musicPlaceholder),
    [imageUrl, type]
  );

  const imgAlt = useMemo(
    () => `${title} ${type === "artist" ? "Image" : "Cover"}`,
    [title, type]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!entity) return;
      openContextMenu(e.clientX, e.clientY, entity, type);
    },
    [entity, type, openContextMenu]
  );

  return (
    <div
      className={styles.entityItem}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {!isSmall && index !== undefined && (
        <>
          {showVisualizer ? (
            <div className={styles.entityIndex}>
              <SoundVisualizer isPlaying={state.isPlaying} />
            </div>
          ) : (
            <span className={styles.entityIndex}>{index}</span>
          )}
        </>
      )}
      <LazyImg
        src={imgSrc}
        blurHash={blurHash}
        alt={imgAlt}
        imgClassNames={[styles.entityImage]}
      />
      <div className={styles.entityInfo}>
        {author &&
          (authorLinkTo ? (
            <Link
              to={authorLinkTo}
              className={classNames(
                styles.entityAuthor,
                styles.entityAuthorLink
              )}
            >
              {author}
            </Link>
          ) : (
            <span className={styles.entityAuthor}>{author}</span>
          ))}

        <Link className={styles.entityTitle} to={linkTo}>
          {title}
        </Link>
        {subtitle && <span className={styles.entitySubtitle}>{subtitle}</span>}
      </div>
      <EntityActionButtons
        type={type}
        entity={entity}
        isHovered={isHovered}
        isSmall={isSmall}
      />
    </div>
  );
};

export default memo(EntityItem);
