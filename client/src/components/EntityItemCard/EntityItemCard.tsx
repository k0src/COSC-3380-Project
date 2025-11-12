import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAudioQueue, useAuth } from "@contexts";
import type { Song, Playlist, Album } from "@types";
import { QueueMenu, LazyImg } from "@components";
import styles from "./EntityItemCard.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import artistPlaceholder from "@assets/artist-placeholder.webp";
import { LuPlay, LuPause, LuListEnd } from "react-icons/lu";
import classNames from "classnames";

interface EntityActionButtonsProps {
  type: "song" | "playlist" | "album" | "artist";
  entity?: Song | Playlist | Album;
  isHovered: boolean;
}

const EntityActionButtons: React.FC<EntityActionButtonsProps> = memo(
  ({ type, entity, isHovered }) => {
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
              justification="center"
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

type EntityItemCardProps =
  | {
      type: "artist";
      linkTo: string;
      author?: string;
      authorLinkTo?: string;
      title: string;
      subtitle: string;
      imageUrl?: string;
      blurHash?: string;
      entity?: never;
    }
  | {
      type: "song" | "playlist" | "album";
      linkTo: string;
      author?: string;
      authorLinkTo?: string;
      title: string;
      subtitle: string;
      imageUrl?: string;
      blurHash?: string;
      entity: Song | Playlist | Album;
    };

const EntityItemCard: React.FC<EntityItemCardProps> = ({
  entity,
  imageUrl,
  blurHash,
  linkTo,
  author,
  authorLinkTo,
  title,
  subtitle,
  type,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const imgSrc = useMemo(() => {
    if (type === "artist") {
      return imageUrl || artistPlaceholder;
    }
    return imageUrl || musicPlaceholder;
  }, [type, imageUrl]);

  const imgAlt = useMemo(() => {
    return `${title} ${type === "artist" ? "Image" : "Cover"}`;
  }, [title, type]);

  return (
    <div
      className={styles.entityItemCard}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.entityImageContainer}>
        <LazyImg
          src={imgSrc}
          alt={imgAlt}
          imgClassNames={[styles.entityImage]}
          blurHash={blurHash}
        />
        <EntityActionButtons
          type={type}
          entity={entity}
          isHovered={isHovered}
        />
      </div>
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
        <Link to={linkTo} className={styles.entityTitle}>
          {title}
        </Link>
        <span className={styles.entitySubtitle}>{subtitle}</span>
      </div>
    </div>
  );
};

export default memo(EntityItemCard);
