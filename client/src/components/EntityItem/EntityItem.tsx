import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAudioQueue, useAuth } from "@contexts";
import type { Song, Playlist, Album } from "@types";
import { QueueMenu } from "@components";
import styles from "./EntityItem.module.css";
import musicPlaceholder from "@assets/music-placeholder.png";
import artistPlaceholder from "@assets/artist-placeholder.png";
import { LuPlay, LuListEnd } from "react-icons/lu";

interface EntityActionButtonsProps {
  type: "song" | "list" | "artist";
  entity?: Song | Playlist | Album;
  isHovered: boolean;
  isSmall: boolean;
}

const EntityActionButtons: React.FC<EntityActionButtonsProps> = memo(
  ({ type, entity, isHovered, isSmall }) => {
    const { actions } = useAudioQueue();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [queueMenuOpen, setQueueMenuOpen] = useState(false);
    const queueButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (!isHovered && queueMenuOpen) {
        setQueueMenuOpen(false);
      }
    }, [isHovered, queueMenuOpen]);

    const handlePlay = useCallback(() => {
      if (!entity) return;
      actions.play(entity);
    }, [actions, entity]);

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
                song={entity as Song}
                buttonRef={queueButtonRef}
                justification="right"
              />
            </div>
          )}
          {(type === "song" || type === "list") && (
            <button onClick={handlePlay} className={styles.entityActionButton}>
              <LuPlay />
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
              song={entity as Song}
              buttonRef={queueButtonRef}
              justification="right"
            />
          </div>
        )}
        {(type === "song" || type === "list") && (
          <button onClick={handlePlay} className={styles.entityActionButton}>
            <LuPlay />
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
      title: string;
      subtitle?: string;
      imageUrl?: string;
      entity?: never;
      isSmall?: boolean;
      index?: number;
    }
  | {
      type: "song" | "list";
      linkTo: string;
      author?: string;
      title: string;
      subtitle?: string;
      imageUrl?: string;
      entity: Song | Playlist | Album;
      isSmall?: boolean;
      index?: number;
    };

/**
 * @param EntityItemProps
 * @param entity The entity object to play when clicking play (Song, Playlist, or Album)
 * @param imageUrl Image URL for the entity
 * @param linkTo Link to navigate to when clicking the title
 * @param author Author name to display (text above title)
 * @param title Title of the entity
 * @param subtitle Subtitle text to display (text below title)
 * @param type Type of entity: "song", "list", or "artist"
 * @param isSmall Whether to use small layout (default: true).
 * @param index Optional index number to display (for non-small layout)
 */
const EntityItem: React.FC<EntityItemProps> = ({
  entity,
  imageUrl,
  linkTo,
  author,
  title,
  subtitle,
  type,
  isSmall = true,
  index,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={styles.entityItem}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isSmall && index !== undefined && (
        <span className={styles.entityIndex}>{index}</span>
      )}
      <img
        src={
          imageUrl || (type === "artist" ? artistPlaceholder : musicPlaceholder)
        }
        alt={`${title} ${type === "artist" ? "Image" : "Cover"}`}
        className={styles.entityImage}
        loading="lazy"
      />
      <div className={styles.entityInfo}>
        {author && <span className={styles.entityAuthor}>{author}</span>}
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