import React from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate } from "react-router-dom";
import type {
  Song,
  Artist,
  Comment,
  Album,
  SongArtist,
  UUID,
  CoverGradient,
  RGB,
  ArtistSong,
  SuggestedSong,
} from "../../types";
import styles from './ArtistPage.module.css'
// import Sidebar from "../../components/SideBar/sidebar";
// import Topbar from "../../components/TopBar/topBar";
// import PlayerBar from "../../components/PlayerBar/playerBar";
import ArtistBanner from '../../components/ArtistBanner/ArtistBanner';
import ArtistBio from '../../components/ArtistBio/ArtistBio'
import SongCard from "../../components/SongCard/SongCard";
import ArtistCard from "../../components/ArtistCard/ArtistCard";
import { artistApi } from "@api/artist.api";
import { useAsyncData } from "../../hooks";
import { useAuth } from "../../contexts/AuthContent.js";
import { songApi } from "../../api/song.api.js";



const ArtistPage: React.FC = () => {
    const { id } = useParams<{ id: UUID }>();
    const { user, isAuthenticated } = useAuth();

      if (!id) {
    return <div>Invalid song ID</div>;
  }
    


  const { data, loading, error } = useAsyncData(
      {
        artist: () =>
          artistApi.getSongs(id, {
            includeAlbum: true,
            // includeArtist: true,
            includeLikes: true,
          }),
        moreSongsByArtist: async () =>
          artistApi.getSongs(
            "84a51edc-a38f-4659-974b-405b3e40f432", // test - pass artist as prop
            { limit: 5 }
          ),
        suggestedSongs: () =>
          songApi.getSuggestedSongs(id, {
            userId: isAuthenticated && user ? user.id : undefined,
            limit: 5,
          }),
      },
      [id],
      { cacheKey: `song_${id}`, hasBlobUrl: true }
    );
  const artist = data?.artist;
  const moreSongsByArtist = data?.moreSongsByArtist;
  const suggestedSongs = data?.suggestedSongs;

  // Mock data
  const popularSongs = Array(10).fill({ // Renamed and shortened to Top 5
    title: "Song Title",
    artist: {artist},
    image: "/PlayerBar/Mask group.png",
    plays: Math.random()*100000,
    likes: Math.random()*1000,
    comments: Math.random()*100,
  });

  const albums = [
    { title: 'Certified Lover Boy', artist: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/en/7/79/Drake_-_Certified_Lover_Boy.png' , year: 2008},
    { title: 'Scorpion', artist: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/en/9/90/Scorpion_by_Drake.jpg' , year: 2008},
    { title: 'Views', artist: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/en/a/af/Drake_-_Views_cover.jpg' , year: 2008},
    { title: 'Take Care', artist: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/en/a/ae/Drake_-_Take_Care_cover.jpg' , year: 2008},
    { title: 'Nothing Was the Same', artist: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/en/4/42/Drake_-_Nothing_Was_the_Same_cover.png' , year: 2008},
    { title: 'Nothing Was the Same', artist: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/en/4/42/Drake_-_Nothing_Was_the_Same_cover.png' , year: 2008},
    { title: 'Nothing Was the Same', artist: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/en/4/42/Drake_-_Nothing_Was_the_Same_cover.png' , year: 2008},
    { title: 'Nothing Was the Same', artist: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/en/4/42/Drake_-_Nothing_Was_the_Same_cover.png' , year: 2008},
  ];

  const singles = Array(8).fill({ // Using your original 'newSongs' data
    title: "New Release",
    artist: "Drake",
    image: "/PlayerBar/Mask group.png",
    year: 2008
  });

  const relatedArtists = [
     { name: 'Diddy', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSESUJJt24KBJL4V0TqWT1qSE5tDZ1tawD14Q&s' },
     { name: 'The Weeknd', image: 'https://placehold.co/600x400' },
     { name: 'Future', image: 'https://placehold.co/600x400' },
     { name: 'Lil Wayne', image: 'https://placehold.co/600x400' },
     { name: 'Rihanna', image: 'https://placehold.co/600x400' },
     { name: 'Travis Scott', image: 'https://placehold.co/600x400' },
  ];

  const sampleBio = "Aubrey Drake Graham, known professionally as Drake, is a Canadian rapper, singer, and actor who has won multiple Grammys and Billboard Music Awards. His signature sound combines singing and rapping, and juxtaposes vulnerability with braggadocio. Drake's 2010 debut album, Thank Me Later, debuted at number one, and he's won Grammys for best rap album for Take Care in 2013, and best rap song for \"Hotline Bling\" in 2017 and \"God's Plan\" in 2019."

  return (
    <>
    <Helmet>
      DRAKE
    </Helmet>
      {/* <Topbar />
      <Sidebar /> */}
      
      <main className={styles.contentArea}>
        <div className={styles.contentWrapper}>
          
          <ArtistBanner 
            artistName="Drake" 
            location="Toronto" 
            imageURL="https://i2.wp.com/www.passionweiss.com/wp-content/uploads/2024/07/Drake_POW-ezgif.com-webp-to-jpg-converter-1.jpg?resize=1000%2C1000&ssl=1"
          />

          {/* Popular Tracks Section */}
          <section className={styles.trackListSection}>
            <h2 className={[styles.interHeading2, styles.sectionTitle].join(' ')}>Popular</h2>
            <div className={styles.verticalCardsList}>
              {popularSongs.map((song, index) => (
                <div key={index} className={styles.compactCard}>
                  <span className={styles.trackNumber}>{index + 1}</span>
                  <img src={song.image} alt={song.title} />
                  <div className={styles.songInfo}>
                    <h3 className={[styles.instrumentSansContent, styles.verticalSongTitle].join(' ')}>{song.title}</h3>
                    {/* <p className={[styles.instrumentSansContent, styles.artistName].join(' ')}>{song.artist}</p> */}
                  </div>
                  <span className={styles.songPlays}>{song.plays.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Albums Section */}
          <section className={styles.horizontalScrollSection}>
            <h2 className={[styles.interHeading2, styles.sectionTitle].join(' ')}>Albums</h2>
            <div className={styles.horizontalCardList}>
              {albums.map((album, index) => (
                <div key={index} className={styles.albumCard}>
                  <img src={album.image} alt={album.title} />
                  <h3 className={[styles.instrumentSansContent, styles.songTitle].join(' ')}>{album.title}</h3>
                  <p className={[styles.instrumentSansContent, styles.songArtist].join(' ')}>{album.artist}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Singles Section */}
          <section className={styles.horizontalScrollSection}>
            <h2 className={[styles.interHeading2, styles.sectionTitle].join(' ')}>Singles</h2>
            <div className={styles.horizontalCardList}>
              {singles.map((song, index) => (
                // <div key={index} className={styles.albumCard}> {/* Reusing albumCard style */}
                //   <img src={song.image} alt={song.title} />
                //   <h3 className={styles.albumTitle}>{song.title}</h3>
                //   <p className={styles.artistName}>{song.artist}</p>
                // </div>
                <SongCard key={index} {...song} />
              ))}
            </div>
          </section>

          {/* Fans Also Like Section */}
          <section className={styles.horizontalScrollSection}>
            <h2 className={[styles.interHeading2, styles.sectionTitle].join(' ')}>Fans Also Like</h2>
            <div className={styles.horizontalCardList}>
              {relatedArtists.map((artist, index) => (
                <ArtistCard index={index} artist={artist} />
              ))}
            </div>
          </section>

          {/* About Section */}
          <section className={styles.aboutSection}>
            <h2 className={[styles.interHeading2, styles.sectionTitle].join(' ')}>About</h2>
            <ArtistBio bio={sampleBio} followerCount={250}/>
          </section>

        </div>
      </main>

      {/* <PlayerBar /> */}
    </>
  );
};

export default ArtistPage;