import { memo } from "react";
import { Link } from "react-router-dom";
import { LazyImg } from "@components";
import styles from "./ArtistEntityCard.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

export interface ArtistEntityCardProps {
  title: string;
  imageUrl?: string;
  blurhash?: string;
  linkTo: string;
  subtitle?: string;
  type: string;
}

const ArtistEntityCard: React.FC<ArtistEntityCardProps> = ({
  title,
  imageUrl,
  blurhash,
  linkTo,
  subtitle,
  type,
}) => {
  return (
    <Link to={linkTo} className={styles.artistEntityCard}>
      <div className={styles.imageContainer}>
        <LazyImg
          src={imageUrl || musicPlaceholder}
          alt={`${title} Cover`}
          blurHash={blurhash}
          imgClassNames={[styles.entityImage]}
        />
      </div>
      <div className={styles.entityInfo}>
        {subtitle && <span className={styles.entitySubtitle}>{subtitle}</span>}
        <span className={styles.entityTitle}>{title}</span>
        <span className={styles.entityType}>{type}</span>
      </div>
    </Link>
  );
};

export default memo(ArtistEntityCard);
