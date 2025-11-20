import { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UploadSuccessModal.module.css";
import { LuX, LuCircleCheck } from "react-icons/lu";

interface UploadSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  songId: string;
}

export const UploadSuccessModal: React.FC<UploadSuccessModalProps> = ({
  isOpen,
  onClose,
  songTitle,
  songId,
}) => {
  const navigate = useNavigate();

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

  const handleViewSong = () => {
    navigate(`/songs/${songId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={onClose}>
            <LuX />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <LuCircleCheck className={styles.icon} />
          </div>

          <span className={styles.title}>Upload Successful!</span>

          <span className={styles.message}>
            <strong>{songTitle}</strong> has been uploaded and is now available
            to stream.
          </span>

          <button className={styles.viewSongButton} onClick={handleViewSong}>
            View Song
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(UploadSuccessModal);
