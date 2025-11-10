import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAudioQueue, useAuth } from "@contexts";
import type { Song, Playlist, Album } from "@types";
import { QueueMenu, LazyImg } from "@components";
import styles from "./EntityItemCard.module.css";
import musicPlaceholder from "@assets/music-placeholder.png";
import artistPlaceholder from "@assets/artist-placeholder.png";
import { LuPlay, LuListEnd } from "react-icons/lu";

interface EntityActionButtonsProps {
  type: "song" | "playlist" | "album" | "artist";
  entity?: Song | Playlist | Album;
  isHovered: boolean;
}

const EntityActionButtons: React.FC<EntityActionButtonsProps> = memo(
  ({ type, entity, isHovered }) => {
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
          <button onClick={handlePlay} className={styles.entityActionButton}>
            <LuPlay />
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
      author: string;
      title: string;
      subtitle: string;
      imageUrl?: string;
      blurHash?: string;
      entity?: never;
    }
  | {
      type: "song" | "playlist" | "album";
      linkTo: string;
      author: string;
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
        <span className={styles.entityAuthor}>{author}</span>
        <Link to={linkTo} className={styles.entityTitle}>
          {title}
        </Link>
        <span className={styles.entitySubtitle}>{subtitle}</span>
      </div>
    </div>
  );
};

export default memo(EntityItemCard);
