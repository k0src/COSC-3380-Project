import React from 'react';
import styles from './LandingPage.module.css';

// Embedded SVG for the search icon
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#B3B3B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="#B3B3B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LandingPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      {/* 1. Navbar */}
      <header className={styles.navbar}>
        <div className={styles.logo}>COOGMUSIC</div>
        <nav className={styles.navButtons}>
          <button className={`${styles.navButton} ${styles.signUpButton}`}>SIGN UP</button>
          <button className={`${styles.navButton} ${styles.loginButton}`}>LOGIN</button>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>BY ARTISTS, FOR ARTISTS</h1>
          <p className={styles.heroSubtitle}>
            Get obsessed, or become part of someone's obsession. 
            All it takes is an upload!
          </p>
          <button className={styles.uploadButton}>UPLOAD NOW</button>
        </div>
        {/* The image is applied as a CSS background */}
      </section>

      {/* 3. Search Bar */}
      <div className={styles.searchBarContainer}>
        <div className={styles.searchBar}>
          <SearchIcon />
          <input type="text" placeholder="SEARCH SONGS, ARTISTS, PLAYLISTS" />
        </div>
      </div>

      {/* 4. Main Content Area (the black box) */}
      <main className={styles.mainContent}>
        {/* This is the large empty black area. 
            You can add your trending/featured components here. */}
      </main>
    </div>
  );
};

export default LandingPage;