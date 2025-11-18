import React from "react";
import styles from "./SongBar.module.css";

export interface SongBarProps {
  image: string;
  title: string;
  artist: string;
  genre: string;
  plays: number;
  likes: number;
  comments: number;
}

const SongBar: React.FC<SongBarProps> = ({
  image,
  title,
  artist,
  genre,
  plays,
  likes,
  comments,
}) => {
  return (
    <article className={styles.songBar}>
      <div className={styles.cover}>
        <img src={image} alt={title} className={styles.coverImage} />
      </div>

      <div className={styles.details}>
        <div className={styles.primaryInfo}>
        <div className={styles.titleContainer}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.artist}>{artist}</p>
        </div>
          <div className={styles.genreContainer}>
            <span className={styles.genre}>{genre}</span>
          </div>
        </div>

        <div className={styles.stats}>
          <div>
            <span className={styles.statLabel}>Plays</span>
            <strong>{plays.toLocaleString()}</strong>
          </div>
          <div>
            <span className={styles.statLabel}>Likes</span>
            <strong>{likes.toLocaleString()}</strong>
          </div>
          <div>
            <span className={styles.statLabel}>Comments</span>
            <strong>{comments.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </article>
  );
};

export default SongBar;