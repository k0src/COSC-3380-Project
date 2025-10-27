import homeStyles from "../HomePage/HomePage.module.css";
import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";
import SongCard from "../../components/SongCard/SongCard";

export default function SearchResultsPage() {
  // Mock data for recently played
  const recentSongs = Array(4).fill({
    title: "Song Title",
    artist: "Artist Name",
    image: "/PlayerBar/Mask group.png",
    plays: 1234,
    likes: 234,
    comments: 12,
  });

  // Mock data for artists, albums, playlists
  const newArtists = Array(8).fill({
    name: "Artist Name",
    image: "/PlayerBar/Mask group.png",
    plays: 321000,
    likes: 12345,
    comments: 456,
  });

  const newAlbums = Array(8).fill({
    title: "Album Title",
    artist: "Artist Name",
    image: "/PlayerBar/Mask group.png",
    plays: 210000,
    likes: 9876,
    comments: 321,
  });

  const newPlaylists = Array(8).fill({
    title: "Playlist Name",
    artist: "User Name",
    image: "/PlayerBar/Mask group.png",
    plays: 150000,
    likes: 5432,
    comments: 210,
  });
  return (
    <>
      <Topbar />
      <Sidebar />


      <main className={homeStyles.contentArea}>
        <div className={homeStyles.contentWrapper}>
          <section className={homeStyles.recentlyPlayedColumn}>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>Songs</h2>
              <a href="#" className={homeStyles.viewMore}>View More</a>
            </div>
            <div className={homeStyles.verticalCardsList}>
              {recentSongs.map((song, index) => (
                <div key={index} className={homeStyles.compactCard}>
                  <img src={song.image} alt={song.title} />
                  <div className={homeStyles.songInfo}>
                    <h3 className={homeStyles.songTitle}>{song.title}</h3>
                    <p className={homeStyles.artistName}>{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Artists Section */}
          <section className={homeStyles.section}>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>Artists</h2>
              <a href="#" className={homeStyles.viewMore}>View More</a>
            </div>
            <div className={homeStyles.cardsContainer}>
              {newArtists.map((artist, index) => (
                <SongCard
                  key={`artist-${index}`}
                  title={artist.name}
                  artist={""}
                  image={artist.image}
                  plays={artist.plays}
                  likes={artist.likes}
                  comments={artist.comments}
                  showStats={false}
                />
              ))}
            </div>
          </section>

          {/* Albums Section */}
          <section className={homeStyles.section}>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>Albums</h2>
              <a href="#" className={homeStyles.viewMore}>View More</a>
            </div>
            <div className={homeStyles.cardsContainer}>
              {newAlbums.map((album, index) => (
                <SongCard
                  key={`album-${index}`}
                  title={album.title}
                  artist={album.artist}
                  image={album.image}
                  plays={album.plays}
                  likes={album.likes}
                  comments={album.comments}
                  showStats={false}
                />
              ))}
            </div>
          </section>

          {/* Playlists Section */}
          <section className={homeStyles.section}>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>Playlists</h2>
              <a href="#" className={homeStyles.viewMore}>View More</a>
            </div>
            <div className={homeStyles.cardsContainer}>
              {newPlaylists.map((pl, index) => (
                <SongCard
                  key={`pl-${index}`}
                  title={pl.title}
                  artist={pl.artist}
                  image={pl.image}
                  plays={pl.plays}
                  likes={pl.likes}
                  comments={pl.comments}
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
}
