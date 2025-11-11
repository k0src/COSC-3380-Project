import React from "react";
import styles from "./FeaturedSection.module.css";


interface FeaturedSectionProps {
  title: string;
  description: string;
  image: string;
  likes: number;
  tracks: number;
  duration: string;
}

const FeaturedSection: React.FC<FeaturedSectionProps> = ({
  title,
  description,
  image,
  likes,
  tracks,
  duration,
}) => (
  <section className={styles.featuredSection}>
    <div className={styles.featuredLeft}>
      <h3 className={styles.featuredSubtitle}>Featured Playlist</h3>
      <h2 className={styles.featuredTitle}>{title}</h2>
      <p className={styles.featuredDescription}>{description}</p>
      <div className={styles.featuredMeta}>
        <img className={styles.metaIcon} />
            <span>{likes.toLocaleString()} likes</span>
            <span>• {tracks} tracks</span>
            <span>• {duration}</span>
      </div>
    </div>

    <div className={styles.featuredRight}>
      <div className={styles.featuredImageContainer}>
        <img src={image} alt={title} className={styles.featuredImage} />
        <button className={styles.playButton}>
        </button>
      </div>
    </div>
  </section>
);

export default FeaturedSection;