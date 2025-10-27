import React from "react";
import styles from "./SongCard.module.css";

export interface SongCardProps {
  image: string;
  title: string;
  artist: string;
  plays: number;
  likes: number;
  comments: number;
}

const SongCard: React.FC<SongCardProps> = ({
  image,
  title,
  artist,
  plays,
  likes,
  comments,
}) => {
  return (
    <div className={styles.songCard}>
      <div className={styles.imageContainer}>
        <img src={image} alt={title} className={styles.songImage} />
        <div className={styles.overlay}>
          <button className={styles.playButton}></button>
        </div>
      </div>

      <div className={styles.songInfo}>
        <p className={styles.songTitle}>{title}</p>
        <span className={styles.songArtist}>{artist}</span>
      </div>

      <div className={styles.songStats}>
        <div className={styles.statItem}>
          <span>{plays}</span>
        </div>
        <div className={styles.statItem}>
          <span>{likes}</span>
        </div>
        <div className={styles.statItem}>
          <span>{comments}</span>
        </div>
      </div>
    </div>
  );
};

export default SongCard;
