import React from "react";
import styles from "./HomePage.module.css";
import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";
import SongCard from "../../components/SongCard/SongCard";

// Local FeaturedSection component to replace missing import/file
function FeaturedSection({
  title,
  description,
  image,
  likes,
  tracks,
  duration,
}: {
  title: string;
  description: string;
  image: string;
  likes: number;
  tracks: number;
  duration: string;
}) {
  return (
    <div className={styles.featuredSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p>{description}</p>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <img src={image} alt={title} style={{ width: 120, height: 120, borderRadius: 8, objectFit: "cover" }} />
        <div>
          <p>Likes: {likes.toLocaleString()}</p>
          <p>Tracks: {tracks}</p>
          <p>Duration: {duration}</p>
        </div>
      </div>
    </div>
  );
}

const HomePage: React.FC = () => {
  // Mock data
  const recentSongs = Array(8).fill({
    title: "Song Title",
    artist: "Artist Name",
    image: "/PlayerBar/Mask group.png",
    plays: 1234,
    likes: 234,
    comments: 12,
  });

  const newSongs = Array(5).fill({
    title: "New Release",
    artist: "Artist Name",
    image: "/PlayerBar/Mask group.png",
  });

  return (
    <>
      <Topbar />
      <Sidebar />
      
      <main className={styles.contentArea}>
        <div className={styles.contentWrapper}>
          {/* Top Grid Layout */}
          <div className={styles.topGrid}>
            {/* Featured Column */}
            <section className={styles.section}>
              <FeaturedSection
                title="Chill Vibes"
                description="Smooth beats and ambient tunes to keep you relaxed."
                image="/PlayerBar/Mask group.png"
                likes={10234}
                tracks={58}
                duration="2h 15min"
              />
            </section>

            {/* Recently Played Column */}
            <section className={styles.recentlyPlayedColumn}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recently Played</h2>
                <a href="#" className={styles.viewMore}>View More</a>
              </div>
              <div className={styles.verticalCardsList}>
                {recentSongs.map((song, index) => (
                  <div key={index} className={styles.compactCard}>
                    <img src={song.image} alt={song.title} />
                    <div className={styles.songInfo}>
                      <h3 className={styles.songTitle}>{song.title}</h3>
                      <p className={styles.artistName}>{song.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* New Releases Section - Full Width */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>New Releases</h2>
              <a href="#" className={styles.viewMore}>View More</a>
            </div>
            <div className={styles.cardsContainer}>
              {newSongs.map((song, index) => (
                <SongCard
                  key={index}
                  image={song.image}
                  title={song.title}
                  artist={song.artist}
                  plays={0}
                  likes={0}
                  comments={0}
                  showStats={false}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      <PlayerBar />
    </>
  );
};

export default HomePage;