import { memo, useEffect } from "react";
import { LazyImg } from "@components";
import { LuX } from "react-icons/lu";
import styles from "./CoverLightbox.module.css";

interface CoverLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

const CoverLightbox: React.FC<CoverLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText,
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeButton} onClick={onClose}>
        <LuX />
      </button>
      <div className={styles.lightbox} onClick={(e) => e.stopPropagation()}>
        <LazyImg
          src={imageUrl}
          alt={altText}
          imgClassNames={[styles.coverImage]}
          loading="eager"
        />
      </div>
    </div>
  );
};

export default memo(CoverLightbox);
