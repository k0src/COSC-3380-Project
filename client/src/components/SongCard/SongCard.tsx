import React from "react";
import styles from "./SongCard.module.css";
import { Play } from "lucide-react";

export interface SongCardProps {
  image: string;
  title: string;
  artist: string;
  plays: number;
  likes: number;
  comments: number;
  year: number;
}

const SongCard: React.FC<SongCardProps> = ({
  image,
  title,
  artist,
  plays,
  likes,
  comments,
  year,
}) => {
  return (
    <div className={styles.songCard}>
      <div className={styles.imageContainer}>
        <img src={image} alt={title} className={styles.songImage} />
        <div className={styles.overlay}>

          <Play size={48} />

        </div>
      </div>

      <div className={styles.songInfo}>
        <p className={[styles.instrumentSansContent, styles.songTitle].join(' ')}>{title}</p>
      </div>

    <div className={styles.songMainInfo}>
      <div>
        <span className={[styles.instrumentSansContent, styles.songArtist].join(' ')}>{artist}</span>
      </div>
      <div>
        <p className={[styles.instrumentSansContent, styles.songArtist].join(' ')}>{year}</p>
      </div>
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