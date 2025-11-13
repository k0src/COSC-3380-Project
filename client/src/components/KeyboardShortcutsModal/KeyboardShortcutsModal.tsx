import { memo, useEffect } from "react";
import { LuX, LuKeyboard } from "react-icons/lu";
import { keyboardShortcuts } from "@hooks";
import styles from "./KeyboardShortcutsModal.module.css";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <LuKeyboard className={styles.titleIcon} />
            <h2 className={styles.title}>Keyboard Shortcuts</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <LuX />
          </button>
        </div>

        <div className={styles.shortcutsGrid}>
          {keyboardShortcuts.map((shortcut, index) => (
            <div key={index} className={styles.shortcutItem}>
              <div className={styles.keyContainer}>
                {shortcut.key.split(" + ").map((keyPart, keyIndex) => (
                  <span key={keyIndex} className={styles.keyGroup}>
                    {keyIndex > 0 && <span className={styles.plus}>+</span>}
                    <kbd className={styles.key}>{keyPart}</kbd>
                  </span>
                ))}
              </div>
              <span className={styles.description}>{shortcut.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(KeyboardShortcutsModal);
