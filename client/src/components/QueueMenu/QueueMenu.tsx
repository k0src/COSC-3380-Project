import { memo, useEffect, useRef } from "react";
import { LuListStart, LuListEnd } from "react-icons/lu";
import { useAudioQueue } from "@contexts";
import type { Song } from "@types";
import styles from "./QueueMenu.module.css";
import { useCallback } from "react";
import classNames from "classnames";

interface QueueMenuProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  justification?: "left" | "center" | "right";
}

const QueueMenu: React.FC<QueueMenuProps> = ({
  isOpen,
  onClose,
  song,
  buttonRef,
  justification = "center",
}) => {
  const { actions } = useAudioQueue();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    },
    [onClose, buttonRef]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleEscape, handleClickOutside]);

  const handleQueueNext = () => {
    actions.queueNext(song);
    onClose();
  };

  const handleQueueLast = () => {
    actions.queueLast(song);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={classNames(styles.queueMenu, {
        [styles.justifyLeft]: justification === "left",
        [styles.justifyCenter]: justification === "center",
        [styles.justifyRight]: justification === "right",
      })}
    >
      <button className={styles.menuButton} onClick={handleQueueNext}>
        <LuListStart className={styles.menuIcon} />
        <span>Queue Next</span>
      </button>
      <button className={styles.menuButton} onClick={handleQueueLast}>
        <LuListEnd className={styles.menuIcon} />
        <span>Queue Last</span>
      </button>
    </div>
  );
};

export default memo(QueueMenu);
