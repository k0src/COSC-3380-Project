import styles from "./MainLayoutSearchBar.module.css";
import { LuSearch } from "react-icons/lu";

const MainLayoutSearchBar: React.FC = () => {
  return (
    <div className={styles.searchContainer}>
      <LuSearch className={styles.searchIcon} />
      <input
        type="text"
        placeholder="Search for songs, artists, albums, playlists..."
        className={styles.searchInput}
        aria-label="Search"
      />
    </div>
  );
};

export default MainLayoutSearchBar;
