import React from 'react';
import styles from './LandingPage.module.css';
import { Search } from 'lucide-react';
import SongCard from '../../components/SongCard/SongCard';


const LandingPage: React.FC = () => {

  const singles = Array(4).fill({ // Using your original 'newSongs' data
    title: "New Release",
    artist: "Drake",
    image: "/PlayerBar/Mask group.png",
    year: 2008
  });


  return (
    <div className={styles.pageContainer}>
      <header className={styles.navbar}>
        <div className={styles.logo}>COOGMUSIC</div>
        <nav className={styles.navButtons}>
          <button className={`${styles.navButton} ${styles.signUpButton}`}>SIGN UP</button>
          <button className={`${styles.navButton} ${styles.loginButton}`}>LOGIN</button>
        </nav>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>BY ARTISTS, FOR ARTISTS</h1>
          <p className={styles.heroSubtitle}>
            Get obsessed, or become part of someone's obsession. 
            All it takes is an upload!
          </p>
          <button className={styles.uploadButton}>UPLOAD NOW</button>
        </div>
      </section>

      <div className={styles.searchBarContainer}>
        <div className={styles.searchBar}>
          <Search />
          <input type="text" placeholder="SEARCH SONGS, ARTISTS, PLAYLISTS" />
        </div>
      </div>

      <main className={styles.mainContent}>
        <h2 className={styles.trendingHeader}>Or Listen to whats Trending</h2>
        <div className={styles.trendingSection}>
              {singles.map((song, index) => (
                <SongCard key={index} {...song} />
              ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;