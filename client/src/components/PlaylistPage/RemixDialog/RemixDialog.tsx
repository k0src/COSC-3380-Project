import { memo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { UUID } from "@types";
import styles from "./RemixDialog.module.css";

export interface RemixDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  playlistTitle: string;
  playlistId: UUID | null;
  onClose: () => void;
  onRemix: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const RemixDialog: React.FC<RemixDialogProps> = ({
  isOpen,
  isLoading,
  playlistTitle,
  playlistId,
  onClose,
  onRemix,
  buttonRef,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  return (
    <div ref={dialogRef} className={styles.remixDialog}>
      <div className={styles.dialogContent}>
        {playlistId ? (
          <span>
            Created{" "}
            <Link
              to={`/library/playlists/${playlistId}`}
              className={styles.remixLink}
              onClick={onClose}
            >
              {playlistTitle}
            </Link>
            !
          </span>
        ) : (
          <>
            <span className={styles.description}>
              Remix this playlist into something new. We'll combine songs from
              this playlist with related tracks, music from the same artists and
              albums, and tracks from users with similar taste.
            </span>
            <div className={styles.buttonGroup}>
              <button
                className={styles.remixButton}
                onClick={onRemix}
                disabled={isLoading}
              >
                {isLoading ? "Remixing..." : "Remix!"}
              </button>
              <button
                className={styles.cancelButton}
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(RemixDialog);
