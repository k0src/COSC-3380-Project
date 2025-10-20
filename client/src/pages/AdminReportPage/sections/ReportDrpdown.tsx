import React, { useState, useRef, useEffect } from 'react';
import styles from './ReportSection.module.css';

export type ReportType = 'user' | 'song' | 'album' | 'playlist';

interface ReportDropdownProps {
  selectedReport: ReportType;
  onSelect: (type: ReportType) => void;
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

  const handleSelect = (type: ReportType) => {
    onSelect(type);
    setIsOpen(false); // Close dropdown after selecting a report type
  };

  return (
    <div className={styles.reportDropdownContainer} ref={dropdownRef}>
      <button
        className={styles.dropdownButton}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Reports ▾
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {(['user', 'song', 'album', 'playlist'] as ReportType[]).map((type) => (
            <div
              key={type}
              className={`${styles.dropdownItem} ${
                selectedReport === type ? styles.activeDropdownItem : ''
              }`}
              onClick={() => handleSelect(type)}
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