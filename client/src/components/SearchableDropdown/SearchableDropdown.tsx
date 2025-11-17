import { memo, useState, useEffect, useRef, useCallback } from "react";
import styles from "./SearchableDropdown.module.css";
import classNames from "classnames";
import { searchApi } from "@api";
import type { Song, Album, Artist, Playlist } from "@types";

export type EntityType = "song" | "album" | "artist" | "playlist";

type EntityMap = {
  song: Song;
  album: Album;
  artist: Artist;
  playlist: Playlist;
};

export interface SearchableDropdownProps<T extends EntityType> {
  label: string;
  hint?: string;
  error?: string;
  name: string;
  entityType: T;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ownerId?: string;
}

const SearchableDropdown = <T extends EntityType>({
  label,
  hint,
  error,
  name,
  entityType,
  onChange,
  placeholder = "Search...",
  disabled,
  ownerId,
}: SearchableDropdownProps<T>) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<EntityMap[T][]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let data;
        switch (entityType) {
          case "song":
            data = await searchApi.searchSongs(query, ownerId);
            break;
          case "album":
            data = await searchApi.searchAlbums(query, ownerId);
            break;
          case "artist":
            data = await searchApi.searchArtists(query);
            break;
          case "playlist":
            data = await searchApi.searchPlaylists(query, ownerId);
            break;
        }
        setResults(data as EntityMap[T][]);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [entityType, ownerId]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const handleSelectEntity = (entity: EntityMap[T]) => {
    onChange(String(entity.id));
    setSearchQuery(getEntityDisplayName(entity));
    setIsOpen(false);
    setResults([]);
  };

  const getEntityDisplayName = (entity: EntityMap[T]): string => {
    const displayNameMap = {
      song: (e: Song) => e.title,
      album: (e: Album) => e.title,
      artist: (e: Artist) => e.display_name,
      playlist: (e: Playlist) => e.title,
    };
    return displayNameMap[entityType](entity as any);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  return (
    <div className={styles.searchableDropdownGroup} ref={dropdownRef}>
      <label className={styles.searchableDropdownLabel}>{label}</label>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          name={name}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          placeholder={placeholder}
          className={classNames(styles.input, {
            [styles.inputError]: !!error,
          })}
          autoComplete="off"
        />
        {isOpen && (searchQuery.trim() || results.length > 0) && (
          <div className={styles.dropdown}>
            {isLoading && <div className={styles.dropdownItem}>Loading...</div>}
            {!isLoading && results.length === 0 && searchQuery.trim() && (
              <div className={styles.dropdownItem}>No results found</div>
            )}
            {!isLoading &&
              results.map((entity) => (
                <div
                  key={entity.id}
                  className={styles.dropdownItem}
                  onClick={() => handleSelectEntity(entity)}
                >
                  {getEntityDisplayName(entity)}
                </div>
              ))}
          </div>
        )}
      </div>
      {error && (
        <span className={styles.searchableDropdownErrorText}>{error}</span>
      )}
      {hint && !error && (
        <span className={styles.searchableDropdownHint}>{hint}</span>
      )}
    </div>
  );
};

export default memo(SearchableDropdown);
