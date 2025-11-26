import { useState, useEffect, memo, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchApi } from "@api";
import type { SearchResults } from "@api/search.api";
import styles from "./MainLayoutSearchBar.module.css";
import { LuSearch } from "react-icons/lu";

const MainLayoutSearchBar: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResults | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    } else {
      setSearchQuery("");
    }
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions(null);
      setShowDropdown(false);
      return;
    }

    try {
      const data = await searchApi.search(query);
      setSuggestions(data);
      setShowDropdown(true);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions(null);
      setShowDropdown(false);
    }
  }, []);

  const handleSearch = useCallback(
    (query: string = searchQuery) => {
      if (query.trim()) {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
      }
    },
    [searchQuery, navigate]
  );

  const allSuggestions = useCallback(() => {
    if (!suggestions) return [];
    return [
      ...suggestions.songs.map((s) => ({ type: "song" as const, item: s })),
      ...suggestions.albums.map((a) => ({ type: "album" as const, item: a })),
      ...suggestions.artists.map((a) => ({
        type: "artist" as const,
        item: a,
      })),
      ...suggestions.playlists.map((p) => ({
        type: "playlist" as const,
        item: p,
      })),
    ].slice(0, 8);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const suggestionsList = allSuggestions();

    switch (e.key) {
      case "ArrowDown":
        if (suggestionsList.length > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestionsList.length);
        }
        break;
      case "ArrowUp":
        if (suggestionsList.length > 0) {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestionsList.length - 1
          );
        }
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestionsList[selectedIndex]) {
          const selected = suggestionsList[selectedIndex];
          navigate(`/${selected.type}s/${selected.item.id}`);
          setShowDropdown(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (searchQuery.trim() && suggestions) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className={styles.searchContainer}>
      <LuSearch className={styles.searchIcon} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for songs, artists, albums, playlists..."
        className={styles.searchInput}
        aria-label="Search"
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      />
      {showDropdown && allSuggestions().length > 0 && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {allSuggestions().map((suggestion, index) => {
            const displayName =
              "title" in suggestion.item
                ? suggestion.item.title
                : suggestion.item.display_name;
            return (
              <div
                key={`${suggestion.type}-${suggestion.item.id}`}
                className={`${styles.dropdownItem} ${
                  index === selectedIndex ? styles.dropdownItemSelected : ""
                }`}
                onMouseDown={() => {
                  navigate(`/${suggestion.type}s/${suggestion.item.id}`);
                  setShowDropdown(false);
                  setSelectedIndex(-1);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className={styles.dropdownItemText}>{displayName}</span>
              </div>
            );
          })}
        </div>
      )}
      <div
        className={styles.kbdContainer}
        style={{
          opacity: isFocused || searchQuery ? 0 : 1,
        }}
      >
        <kbd className={styles.searchKbd}>ctrl</kbd>
        <kbd className={styles.searchKbd}>k</kbd>
      </div>
    </div>
  );
};

export default memo(MainLayoutSearchBar);
