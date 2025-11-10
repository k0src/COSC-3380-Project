import React from "react";
import styles from "./Sections.module.css";
import SongCard from "../../../components/SongCard/SongCard";

interface Song {
  image: string;
  title: string;
  artist: string;
  plays: number;
  likes: number;
  comments: number;
}

interface RecentSongsSectionProps {
  title: string;
  songs: Song[];
}

const RecentSongsSection: React.FC<RecentSongsSectionProps> = ({ title, songs }) => (
  <section className={styles.section}>
    <div className={styles.sectionHeader}>
      <h2>{title}</h2>
      <button className={styles.viewMore}>View More</button>
    </div>

    <div className={styles.songGrid}>
      {songs.map((song, index) => (
        <SongCard key={index} {...song} />
      ))}
    </div>
  </section>
);

export default RecentSongsSection;