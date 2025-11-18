import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAudioQueue, useAuth, useContextMenu } from "@contexts";
import type { Song, Playlist, Album, Artist, User } from "@types";
import { QueueMenu, LazyImg } from "@components";
import styles from "./TopResultCard.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import userPlaceholder from "@assets/user-placeholder.webp";
import artistPlaceholder from "@assets/artist-placeholder.webp";
import { LuPlay, LuPause, LuListEnd } from "react-icons/lu";
import classNames from "classnames";

interface TopResultCardButtonsProps {
  type: "song" | "album" | "artist" | "playlist" | "user";
  entity: Song | Album | Artist | Playlist | User;
  isHovered: boolean;
}

const TopResultCardButtons: React.FC<TopResultCardButtonsProps> = memo(
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
      } else if (type === "album") {
        return (
          !currentQueueItem.isQueued &&
          currentQueueItem.sourceId === (entity as Album).id &&
          currentQueueItem.sourceType === "album"
        );
      } else if (type === "playlist") {
        return (
          !currentQueueItem.isQueued &&
          currentQueueItem.sourceId === (entity as Playlist).id &&
          currentQueueItem.sourceType === "playlist"
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
        if (type === "song" || type === "album" || type === "playlist") {
          actions.play(entity as Song | Album | Playlist);
        }
      }
    }, [entity, isEntityPlaying, state.isPlaying, actions, type]);

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
      <div className={styles.buttonContainer}>
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

        {(type === "song" || type === "album" || type === "playlist") && (
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

type TopResultCardProps =
  | {
      type: "artist" | "user";
      linkTo: string;
      author?: string;
      authorLinkTo?: string;
      title: string;
      subtitle?: string;
      imageUrl?: string;
      blurHash?: string;
      entity: never;
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
    };

const TopResultCard: React.FC<TopResultCardProps> = ({
  type,
  entity,
  linkTo,
  author,
  authorLinkTo,
  title,
  subtitle,
  imageUrl,
  blurHash,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { openContextMenu } = useContextMenu();

  const imgSrc = useMemo(() => {
    if (type === "artist") {
      return imageUrl || artistPlaceholder;
    } else if (type === "user") {
      return imageUrl || userPlaceholder;
    } else {
      return imageUrl || musicPlaceholder;
    }
  }, [type, imageUrl]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!entity || type === "user") return;
      openContextMenu(e.clientX, e.clientY, entity, type);
    },
    [entity, type, openContextMenu]
  );

  return (
    <div
      className={styles.topResultCard}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.imageContainer}>
        <LazyImg
          src={imgSrc}
          alt={`${title} ${
            type === "artist" || type === "user" ? "Image" : "Cover"
          }`}
          imgClassNames={[
            type === "artist" || type === "user"
              ? styles.imageRound
              : styles.image,
          ]}
          blurHash={blurHash}
        />
        {entity && (
          <TopResultCardButtons
            type={type as "song" | "album" | "artist" | "playlist" | "user"}
            entity={entity}
            isHovered={isHovered}
          />
        )}
      </div>
      <div className={styles.info}>
        <Link to={linkTo} className={styles.title}>
          {title}
        </Link>
        {author &&
          (authorLinkTo ? (
            <Link
              to={authorLinkTo}
              className={classNames(styles.author, styles.authorLink)}
            >
              {author}
            </Link>
          ) : (
            <span className={styles.author}>{author}</span>
          ))}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        <span className={styles.typeLabel}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default memo(TopResultCard);
