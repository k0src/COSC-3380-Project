import { memo, useEffect, useMemo, useRef } from "react";
import { LuListStart, LuListEnd } from "react-icons/lu";
import { useAudioQueue } from "@contexts";
import type { Song, Playlist, Album } from "@types";
import styles from "./QueueMenu.module.css";
import { useCallback } from "react";
import classNames from "classnames";

interface QueueMenuProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Song | Playlist | Album;
  entityType: "song" | "list";
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  justification?: "left" | "center" | "right";
  position?: "top" | "bottom";
}

const QueueMenu: React.FC<QueueMenuProps> = ({
  isOpen,
  onClose,
  entity,
  entityType,
  buttonRef,
  justification = "center",
  position = "top",
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

  const positionClass = useMemo(() => {
    switch (position) {
      case "top":
        return styles.positionTop;
      case "bottom":
        return styles.positionBottom;
      default:
        return "";
    }
  }, [position]);

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

  const handleQueueNext = async () => {
    if (entityType === "song") {
      actions.queueNext(entity as Song);
    } else {
      await actions.queueListNext(entity as Playlist | Album);
    }
    onClose();
  };

  const handleQueueLast = async () => {
    if (entityType === "song") {
      actions.queueLast(entity as Song);
    } else {
      await actions.queueListLast(entity as Playlist | Album);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={classNames(styles.queueMenu, positionClass, {
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
