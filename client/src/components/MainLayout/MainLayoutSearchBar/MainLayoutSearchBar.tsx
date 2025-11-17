import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MainLayoutSearchBar.module.css";
import { LuSearch } from "react-icons/lu";

const MainLayoutSearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={styles.searchContainer}>
      <LuSearch className={styles.searchIcon} />
      <input
        type="text"
        placeholder="Search for songs, artists, albums, playlists..."
        className={styles.searchInput}
        aria-label="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
};

export default MainLayoutSearchBar;
