import { memo } from "react";
import { Link } from "react-router-dom";
import styles from "./EntityItem.module.css";
import musicPlaceholder from "@assets/music-placeholder.png";
import artistPlaceholder from "@assets/artist-placeholder.png";

export interface EntityItemProps {
  imageUrl?: string;
  alt: string;
  author: string;
  title: string;
  linkTo: string;
  subtitle: string;
  type?: "music" | "artist";
}

const EntityItem: React.FC<EntityItemProps> = ({
  imageUrl,
  alt,
  author,
  title,
  linkTo,
  subtitle,
  type = "music",
}) => {
  return (
    <div className={styles.entityItem}>
      <img
        src={
          imageUrl || (type === "music" ? musicPlaceholder : artistPlaceholder)
        }
        alt={alt}
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
