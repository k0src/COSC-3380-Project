import { memo, useState, useEffect, useRef, useCallback } from "react";
import styles from "./SearchableList.module.css";
import classNames from "classnames";
import { searchApi } from "@api";
import type { Song, Album, Artist, Playlist } from "@types";
import { LuCheck, LuX } from "react-icons/lu";

export type EntityType = "song" | "album" | "artist" | "playlist";

type EntityMap = {
  song: Song;
  album: Album;
  artist: Artist;
  playlist: Playlist;
};

export interface SearchableListItem {
  id: string;
  [key: string]: string;
}

export interface SearchableListProps<T extends EntityType> {
  label: string;
  hint?: string;
  error?: string;
  name: string;
  entityType: T;
  value: SearchableListItem[];
  onChange: (value: SearchableListItem[]) => void;
  placeholder?: string;
  disabled?: boolean;
  ownerId?: string;
  secondaryField?: {
    name: string;
    label: string;
    placeholder?: string;
  };
}

const SearchableList = <T extends EntityType>({
  label,
  hint,
  error,
  name,
  entityType,
  value,
  onChange,
  placeholder = "Search...",
  disabled,
  ownerId,
  secondaryField,
}: SearchableListProps<T>) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<EntityMap[T][]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [entityMap, setEntityMap] = useState<Map<string, EntityMap[T]>>(
    new Map()
  );
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
    if (value.some((item) => item.id === String(entity.id))) {
      return;
    }

    const newItem: SearchableListItem = { id: String(entity.id) };
    if (secondaryField) {
      newItem[secondaryField.name] = "";
    }

    const newValue = [...value, newItem];
    const newEntityMap = new Map(entityMap);
    newEntityMap.set(String(entity.id), entity);

    setEntityMap(newEntityMap);
    onChange(newValue);
    setSearchQuery("");
    setResults([]);
  };

  const handleRemoveEntity = (entityId: string) => {
    const newValue = value.filter((item) => item.id !== entityId);
    const newEntityMap = new Map(entityMap);
    newEntityMap.delete(entityId);

    setEntityMap(newEntityMap);
    onChange(newValue);
  };

  const handleSecondaryFieldChange = (entityId: string, fieldValue: string) => {
    if (!secondaryField) return;

    const newValue = value.map((item) =>
      item.id === entityId
        ? { ...item, [secondaryField.name]: fieldValue }
        : item
    );
    onChange(newValue);
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
    <div className={styles.searchableListGroup} ref={dropdownRef}>
      <label className={styles.searchableListLabel}>{label}</label>

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
              results.map((entity) => {
                const isSelected = value.some(
                  (item) => item.id === String(entity.id)
                );
                return (
                  <div
                    key={entity.id}
                    className={classNames(styles.dropdownItem, {
                      [styles.dropdownItemSelected]: isSelected,
                    })}
                    onClick={() => !isSelected && handleSelectEntity(entity)}
                  >
                    {getEntityDisplayName(entity)}
                    {isSelected && (
                      <span className={styles.selectedBadge}>
                        <LuCheck />
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className={styles.selectedList}>
          {value.map((item) => {
            const entity = entityMap.get(item.id);
            if (!entity) return null;
            return (
              <div key={item.id} className={styles.selectedItemRow}>
                <div className={styles.selectedItemMain}>
                  <span className={styles.selectedItemText}>
                    {getEntityDisplayName(entity)}
                  </span>
                  {secondaryField && (
                    <input
                      type="text"
                      value={item[secondaryField.name] || ""}
                      onChange={(e) =>
                        handleSecondaryFieldChange(item.id, e.target.value)
                      }
                      placeholder={secondaryField.placeholder}
                      className={styles.secondaryInput}
                      disabled={disabled}
                    />
                  )}
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemoveEntity(item.id)}
                    disabled={disabled}
                  >
                    <LuX />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <span className={styles.searchableListErrorText}>{error}</span>}
      {hint && !error && (
        <span className={styles.searchableListHint}>{hint}</span>
      )}
    </div>
  );
};

export default memo(SearchableList) as typeof SearchableList;
