import React, { useState, useRef, useEffect } from 'react';
import styles from './AppealsSection.module.css';

export type AppealType = 'user' | 'song' | 'album' | 'playlist';

interface AppealsDropdownProps {
  selectedAppeal: AppealType;
  onSelect: (type: AppealType) => void;
}

const AppealsDropdown: React.FC<AppealsDropdownProps> = ({ selectedAppeal, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (type: AppealType) => {
    if (type !== selectedAppeal) {
      onSelect(type); // trigger parent to fetch new appeals
    }
    setIsOpen(false);
  };

  const getDisplayName = (type: AppealType) => {
    switch (type) {
      case 'user':
        return 'User Account Appeals';
      case 'song':
        return 'Song Appeals';
      case 'album':
        return 'Album Appeals';
      case 'playlist':
        return 'Playlist Appeals';
      default:
        return 'Appeals';
    }
  };

  return (
    <div className={styles.appealsDropdownContainer} ref={dropdownRef}>
      <button
        className={styles.dropdownButton}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {getDisplayName(selectedAppeal)} ▾
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {(['user', 'song', 'album', 'playlist'] as AppealType[]).map((type) => (
            <div
              key={type}
              className={`${styles.dropdownItem} ${
                selectedAppeal === type ? styles.activeDropdownItem : ''
              }`}
              onClick={() => handleSelect(type)}
            >
              {getDisplayName(type)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppealsDropdown;