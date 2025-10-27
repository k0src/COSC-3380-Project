import React from "react";
import styles from "./Sections.module.css";

interface NewSongsSectionProps {
  title: string;
  songs: { image: string; title: string }[];
}

const NewSongsSection: React.FC<NewSongsSectionProps> = ({ title, songs }) => (
  <section className={styles.section}>
    <div className={styles.sectionHeader}>
      <h2>{title}</h2>
      <button className={styles.viewMore}>View More</button>
    </div>

    <div className={styles.newSongsRow}>
      {songs.map((song, index) => (
        <div key={index} className={styles.newSongCard}>
          <img
            src={song.image}
            alt={song.title}
            className={styles.newSongImage}
          />
          <p className={styles.newSongTitle}>{song.title}</p>
        </div>
      ))}
    </div>
  </section>
);

export default NewSongsSection;
