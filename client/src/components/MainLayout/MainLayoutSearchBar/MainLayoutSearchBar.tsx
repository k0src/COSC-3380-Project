import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MainLayoutSearchBar.module.css";
import { LuSearch } from "react-icons/lu";

const MainLayoutSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      const q = query.trim();
      if (q.length > 0) {
        e.preventDefault();
        navigate(`/search?q=${encodeURIComponent(q)}`);
      }
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
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

export default MainLayoutSearchBar;
