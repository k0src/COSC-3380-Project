import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './SearchResultsPage.module.css';
import homeStyles from "../HomePage/HomePage.module.css";
import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";
import { SongCard } from '../../components';

// Mock data types
interface Song {
  id: string;
  title: string;
  artist: string;
  image: string;
  plays: number;
  likes: number;
  comments: number;
}

interface Artist {
  id: string;
  name: string;
  image: string;
  plays: number;
  likes: number;
  comments: number;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  image: string;
  plays: number;
  likes: number;
  comments: number;
}

// Mock data for development
const mockData = {
  songs: [
    { id: '1', title: 'Shape of You', artist: 'Ed Sheeran', image: 'https://via.placeholder.com/150', plays: 1000000, likes: 50000, comments: 2500 },
    { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', image: 'https://via.placeholder.com/150', plays: 800000, likes: 45000, comments: 2000 },
    { id: '3', title: 'Stay', artist: 'Kid Laroi & Justin Bieber', image: 'https://via.placeholder.com/150', plays: 600000, likes: 35000, comments: 1500 },
  ],
  artists: [
    { id: '1', name: 'Ed Sheeran', image: 'https://via.placeholder.com/150', plays: 5000000, likes: 200000, comments: 15000 },
    { id: '2', name: 'The Weeknd', image: 'https://via.placeholder.com/150', plays: 4500000, likes: 180000, comments: 12000 },
    { id: '3', name: 'Justin Bieber', image: 'https://via.placeholder.com/150', plays: 4000000, likes: 160000, comments: 10000 },
  ],
  albums: [
    { id: '1', title: '÷ (Divide)', artist: 'Ed Sheeran', image: 'https://via.placeholder.com/150', plays: 3000000, likes: 150000, comments: 8000 },
    { id: '2', title: 'After Hours', artist: 'The Weeknd', image: 'https://via.placeholder.com/150', plays: 2500000, likes: 120000, comments: 6000 },
    { id: '3', title: 'Justice', artist: 'Justin Bieber', image: 'https://via.placeholder.com/150', plays: 2000000, likes: 100000, comments: 5000 },
  ],
};

type ResultType = 'all' | 'songs' | 'artists' | 'albums';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeFilter, setActiveFilter] = useState<ResultType>('all');

  // Filter results based on search query and active filter
  const getFilteredResults = () => {
    const filterMap: Record<string, Array<Song | Artist | Album>> = {
      songs: mockData.songs.filter(song => 
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase())
      ),
      artists: mockData.artists.filter(artist =>
        artist.name.toLowerCase().includes(query.toLowerCase())
      ),
      albums: mockData.albums.filter(album =>
        album.title.toLowerCase().includes(query.toLowerCase()) ||
        album.artist.toLowerCase().includes(query.toLowerCase())
      ),
    };

    if (activeFilter === 'all') {
      return {
        songs: filterMap.songs,
        artists: filterMap.artists,
        albums: filterMap.albums,
      };
    }

    return {
      [activeFilter]: filterMap[activeFilter],
    };
  };

  const filteredResults = getFilteredResults();

  return (
    <>
      <Topbar />
      <Sidebar />

      <main className={homeStyles.contentArea}>
        <div className={homeStyles.contentWrapper}>
          <div className={styles.container}>
            <section className={homeStyles.section}>
              <div className={homeStyles.sectionHeader}>
                <h2 className={homeStyles.sectionTitle}>Search Results for "{query}"</h2>
              </div>

            <div className={styles.filters}>
              {(['all', 'songs', 'artists', 'albums'] as ResultType[]).map((filter) => (
                <button
                  key={filter}
                  className={`${styles.filterButton} ${activeFilter === filter ? styles.active : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            <div className={styles.results}>
              {Object.entries(filteredResults).map(([type, items]) => (
                items.length > 0 && (
                  <div key={type}>
                    <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                    <div className={styles.results}>
                      {items.map((item) => {
                        const isArtist = (item: any): item is Artist => 'name' in item;
                        return (
                          <SongCard
                            key={item.id}
                            title={isArtist(item) ? item.name : item.title}
                            artist={isArtist(item) ? '' : item.artist}
                            image={(item as any).image}
                            plays={(item as any).plays}
                            likes={(item as any).likes}
                            comments={(item as any).comments}
                          />
                        );
                      })}
                    </div>
                  </div>
                )
              ))}

              {Object.values(filteredResults).every((items: any) => items.length === 0) && (
                <div className={styles.noResults}>
                  No results found for "{query}"
                </div>
              )}
            </div>
            </section>
          </div>
        </div>
      </main>

      <PlayerBar />
    </>
  );
}
