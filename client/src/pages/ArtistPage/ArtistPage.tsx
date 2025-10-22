import React from "react";
import styles from './ArtistPage.module.css'
import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";
import ArtistBanner from "./sections/ArtistBanner";
import ArtistBio from "./sections/ArtistBio";
import SongCard from "../../components/SongCard/SongCard";

const ArtistPage: React.FC = () => {
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

  const sampleBio = "Aubrey Drake Graham, known professionally as  Drake, is a Canadian rapper, singer, and actor who has won multiple  Grammys and Billboard Music Awards. His signature sound combines singing and rapping, and juxtaposes vulnerability with braggadocio. Drake's 2010 debut album, Thank Me Later, debuted at number one, and he's won Grammys for best rap album for Take Care in 2013, and best rap song for \"Hotline Bling\" in 2017 and \"God's Plan\" in 2019."

  return (
    <>
      <Topbar />
      <Sidebar />
      
      <main className={styles.contentArea}>
        <div className={styles.contentWrapper}>
          {/* Top Grid Layout */}
          <div className={styles.topGrid}>
            <ArtistBanner artistName="Drake" location="Toronto" imageURL="https://i2.wp.com/www.passionweiss.com/wp-content/uploads/2024/07/Drake_POW-ezgif.com-webp-to-jpg-converter-1.jpg?resize=1000%2C1000&ssl=1"/>
            </div>
                          <section className={styles.recentlyPlayedColumn}>
                <div className={styles.sectionHeader}>
                  {/* <h2 className={styles.sectionTitle}>Recently Played</h2>  */}
                  {/* <a href="#" className={styles.viewMore}>View More</a> */}
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
            <section className={styles.artistInfo}>
              <section className={styles.artistStats}>
                  <ArtistBio bio={sampleBio} followerCount={250}/>
              </section>
            </section>
        </div>
      </main>

      <PlayerBar />
    </>
  );
};

export default ArtistPage;
