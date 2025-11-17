import React from "react";
import styles from "./ArtistBar.module.css";

export interface ArtistBarProps {
  image: string;
  name: string;
  streams: number;
  followers: number;
}

const formatNumber = (value: number): string =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(value);

const ArtistBar: React.FC<ArtistBarProps> = ({ image, name, streams, followers }) => {
  return (
    <article className={styles.artistBar}>
      <div className={styles.cover}>
        <img src={image} alt={`${name} cover`} className={styles.coverImage} />
      </div>
      <div className={styles.details}>
        <p className={styles.name}>{name}</p>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Streams</span>
            <strong>{formatNumber(streams)}</strong>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Followers</span>
            <strong>{formatNumber(followers)}</strong>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ArtistBar;