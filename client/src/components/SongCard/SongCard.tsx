import React from "react";
import styles from "./SongCard.module.css";
import { Play } from "lucide-react";
import type { Song } from "../../types";

const SongCard: React.FC<Song> = ({
  title,
  artists = [], // This is likely an array of Artist objects, not strings
  image_url,
  streams,
  likes,
  release_date,
}) => {
  const year = release_date ? new Date(release_date).getFullYear().toString() : '';

  // --- FIX: Map over the artists array to get their names ---
  const artistNames = artists.map(artist => artist.display_name).join(', ');

  return (
    <div className={styles.songCard}>
      <div className={styles.imageContainer}>
        <img src={image_url} alt={title} className={styles.songImage} />
        <div className={styles.overlay}>
          <Play size={48} />
        </div>
      </div>

      <div className={styles.songInfo}>
        <p className={[styles.instrumentSansContent, styles.songTitle].join(' ')}>{title}</p>
      </div>

      <div className={styles.songMainInfo}>
        <div>
          {/* Use the new artistNames variable here */}
          <span className={[styles.instrumentSansContent, styles.songArtist].join(' ')}>{artistNames}{" - "}{year}</span>
        </div>
        {/* <div>
          <p className={[styles.instrumentSansContent, styles.songArtist].join(' ')}>{year}</p>
        </div> */}
      </div>
      {/* <div className={styles.songStats}>
        <div className={styles.statItem}>
          <span>{streams}</span>
        </div>
        <div className={styles.statItem}>
          <span>{likes}</span>
        </div>
      </div> */}
    </div>
  );
};

export default SongCard;