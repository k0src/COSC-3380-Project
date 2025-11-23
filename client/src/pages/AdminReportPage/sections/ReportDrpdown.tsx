import React, { useState, useRef, useEffect } from 'react';
import type { ReportEntity, ReportType } from '@types';
import styles from './ReportSection.module.css';

// export type ReportType = 'user' | 'song' | 'album' | 'playlist' | 'artist';

interface ReportDropdownProps {
  selectedReport: ReportEntity;
  onSelect: (type: ReportEntity) => void;
}

const ReportDropdown: React.FC<ReportDropdownProps> = ({ selectedReport, onSelect }) => {
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

  const handleSelect = (type: ReportEntity) => {
    if (type !== selectedReport) {
      onSelect(type); // trigger parent to fetch new reports
    }
    setIsOpen(false);
  };

  return (
    <div 
      className={styles.reportDropdownContainer} 
      ref={dropdownRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      <label htmlFor="report-select" style={{ marginRight: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-gray-light)' }}>
        Filter by Type:
      </label>
      <button
        id="report-select"
        className={styles.dropdownButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Reports
        <span style={{ marginLeft: '0.4rem', opacity: isOpen ? '0.8' : '1', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▾</span>
      </button>

      {isOpen && (
        <div 
          className={styles.dropdownMenu}
          role="listbox"
          style={{ position: 'absolute', top: 'calc(100% + 0.4rem)', left: 0 }}
        >
          {(['USER', 'SONG', 'ALBUM', 'PLAYLIST', 'ARTIST'] as ReportEntity[]).map((type) => (
            <div
              key={type}
              className={`${styles.dropdownItem} ${
                selectedReport === type ? styles.activeDropdownItem : ''
              }`}
              onClick={() => handleSelect(type)}
              role="option"
              aria-selected={selectedReport === type}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} Reports
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportDropdown;