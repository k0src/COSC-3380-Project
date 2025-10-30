import { memo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAudioQueue } from "@contexts";
import type { Song, Playlist, Album } from "@types";
import { QueueMenu } from "@components";
import styles from "./EntityItem.module.css";
import musicPlaceholder from "@assets/music-placeholder.png";
import artistPlaceholder from "@assets/artist-placeholder.png";
import { LuPlay, LuListEnd } from "react-icons/lu";

type EntityItemProps =
  | {
      type: "artist";
      linkTo: string;
      author: string;
      title: string;
      subtitle: string;
      imageUrl?: string;
      entity?: never;
    }
  | {
      type: "song" | "list";
      linkTo: string;
      author: string;
      title: string;
      subtitle: string;
      imageUrl?: string;
      entity: Song | Playlist | Album;
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
 */
const EntityItem: React.FC<EntityItemProps> = ({
  entity,
  imageUrl,
  linkTo,
  author,
  title,
  subtitle,
  type,
}) => {
  const { actions } = useAudioQueue();
  const [queueMenuOpen, setQueueMenuOpen] = useState(false);

  const handlePlay = useCallback(() => {
    if (!entity) return;
    actions.play(entity);
  }, []);

  return (
    <div className={styles.entityItem}>
      <img
        src={
          imageUrl || (type === "artist" ? artistPlaceholder : musicPlaceholder)
        }
        alt={`${title} ${type === "artist" ? "Image" : "Cover"}`}
        className={styles.entityImage}
        loading="lazy"
      />
      <div className={styles.entityInfo}>
        <span className={styles.entityAuthor}>{author}</span>
        <Link className={styles.entityTitle} to={linkTo}>
          {title}
        </Link>
        <span className={styles.entitySubtitle}>{subtitle}</span>
      </div>
    </div>
  );
};

export default memo(EntityItem);
