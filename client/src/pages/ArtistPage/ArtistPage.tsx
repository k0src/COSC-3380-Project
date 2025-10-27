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
import { useAuth } from "@contexts"; // Fixed import path
import { songApi } from "@api/song.api"; // Fixed import path
import { PageLoader } from "@components"; // Assuming you have a loader

const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();
  const { user, isAuthenticated } = useAuth();

  if (!id) {
    return <div className={styles.errorText}>Invalid Artist ID</div>;
  }

  const { data, loading, error } = useAsyncData(
    {
      // 1. Get the artist's details
      artist: () => artistApi.getArtistById(id),

      // 2. Get the artist's popular songs
      popularSongs: () =>
        artistApi.getSongs(id, {
          includeAlbum: true,
          includeLikes: true,
          limit: 10,
          // You might want to add sorting to your API, e.g., sortBy: 'plays'
        }),
      
      // TODO: Add API calls for these sections 
      albums: () => artistApi.getAlbums(id, { limit: 8 }),
      // singles: () => artistApi.getSingles(id, { limit: 8 }),
      relatedArtists: () => artistApi.getOtherArtists(id, { limit: 8 }),
      // relatedArtists: () => artistApi.getRelatedArtists(id, { limit: 6 }),
    },
    [id], // Rerun when the artist ID changes
    { cacheKey: `artist_${id}` } // Updated cache key
  );

  const artist: Artist | undefined = data?.artist;
  const popularSongs: ArtistSong[] | undefined = data?.popularSongs;
  console.log({ popularSongs }); 
  const albums: Album[] = data?.albums || [];
  // const singles: Song[] = data?.singles || [];
  const relatedArtists: Artist[] = data?.relatedArtists || [];

  // --- Mock Data (for sections without API calls yet) ---
  // We'll keep these for now so the UI doesn't break.
  // Replace them when you add the API calls above.
  
  // const albums = [
  //   { title: 'Certified Lover Boy', artist: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/en/7/79/Drake_-_Certified_Lover_Boy.png' , year: 2008},
  //   { title: 'Scorpion', artist: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/en/9/90/Scorpion_by_Drake.jpg' , year: 2008},
  //   // ... other mock albums
  // ];

  // const singles = Array(8).fill({
  //   title: "New Release",
  //   artist: "Drake",
  //   image: "/PlayerBar/Mask group.png",
  //   year: 2008
  // });

  // const relatedArtists = [
  //    { name: 'Diddy', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSESUJJt24KBJL4V0TqWT1qSE5tDZ1tawD14Q&s' },
  //    // ... other mock artists
  // ];
  // ---------------- End Mock Data -----------------


  // Loading and Error States
  if (loading) {
    return <PageLoader />; // Use a proper loading component
  }

  if (error || !artist) {
    return <div className={styles.errorText}>Error loading artist: {error?.message}</div>;
  }

  // If data is loaded, render the page
  return (
    <>
      <Helmet>
        <title>{artist.display_name}</title>
      </Helmet>
      {/* <Topbar />
      <Sidebar /> */}
      
      <main className={styles.contentArea}>
        <div className={styles.contentWrapper}>
          
          <ArtistBanner 
            artistName={artist.display_name} 
            location={artist.location || "Unknown"} 
            imageURL={artist.profile_pic_url || 'https://placehold.co/600x400'} // Use real artist image
          />

          {/* Popular Tracks Section (Using real data) */}
          <section className={styles.trackListSection}>
            <h2 className={[styles.interHeading2, styles.sectionTitle].join(' ')}>Popular</h2>
            <div className={styles.verticalCardsList}>
              {popularSongs?.map((song, index) => (
            <Link 
                    key={song.id} 
                    to={`/songs/${song.id}`} 
                    className={styles.songLink}
                  >
                    <div className={styles.compactCard}>
                      <span className={styles.trackNumber}>{index + 1}</span>
                      
                      {/* I fixed the image URL logic based on our previous file */}
                      <img 
                        src={song.image_url || song.image_url || 'https://placehold.co/48x48/181818/b3b3b3?text=?'} 
                        alt={song.title} 
                      />
                      <div className={styles.songInfo}>
                        <h3 className={[styles.instrumentSansContent, styles.verticalSongTitle].join(' ')}>{song.title}</h3>
                      </div>
                      <span className={styles.songPlays}>
                        {song.streams ? song.streams.toLocaleString() : 0}
                      </span>
                    </div>
                  </Link>
              ))}
            </div>
          </section>

          {/* Albums Section (Still Mocked) */}
          <section className={styles.horizontalScrollSection}>
            <h2 className={[styles.interHeading2, styles.sectionTitle].join(' ')}>Albums</h2>
            <div className={styles.horizontalCardList}>
              {albums.map((album, index) => (
                <div key={index} className={styles.albumCard}>
                  <img src={album.image_url} alt={album.title} />
                  <h3 className={[styles.instrumentSansContent, styles.songTitle].join(' ')}>{album.title}</h3>
                  <p className={[styles.instrumentSansContent, styles.songArtist].join(' ')}>{album.created_by}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Singles Section (Still Mocked) */}
          <section className={styles.horizontalScrollSection}>
            <h2 className={[styles.interHeading2, styles.sectionTitle].join(' ')}>Singles</h2>
            <div className={styles.horizontalCardList}>
              {popularSongs.map((song) => (
                <SongCard key={song.id} {...song} />
              ))}
            </div>
          </section>

          {/* Fans Also Like Section (Still Mocked) */}
          <section className={styles.horizontalScrollSection}>
            <h2 className={[styles.interHeading2, styles.sectionTitle].join(' ')}>Fans Also Like</h2>
            <div className={styles.horizontalCardList}>
              {relatedArtists.map((artist, index) => (
                <Link to={`/artists/${artist.id}`} key={index}>
                  <ArtistCard artist={artist} />
                </Link>
              ))}
            </div>
          </section>

          {/* About Section (Using real data) */}
          <section className={styles.aboutSection}>
            <h2 className={[styles.interHeading2, styles.sectionTitle].join(' ')}>About</h2>
            <ArtistBio 
              bio={artist.bio || "No biography available for this artist."} 
              // Assuming your artist object has `followers_count`
              followerCount={0} 
            />
          </section>

        </div>
      </main>

      {/* <PlayerBar /> */}
    </>
  );
};

export default ArtistPage;