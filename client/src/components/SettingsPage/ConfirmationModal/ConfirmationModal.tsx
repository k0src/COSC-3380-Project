import { useState, memo, useEffect } from "react";
import styles from "./ConfirmationModal.module.css";
import { LuX } from "react-icons/lu";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  warningMessage?: string;
  confirmButtonText: string;
  isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warningMessage,
  confirmButtonText,
  isDangerous = false,
}) => {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (!isOpen) {
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      await onConfirm();
      onClose();
    } catch (error: any) {
      console.error("Confirmation error:", error);
      const errorMessage = error.response?.data?.error || "Operation failed";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <LuX />
          </button>
        </div>

        <div className={styles.content}>
          <span className={styles.message}>{message}</span>
          {warningMessage && (
            <div className={styles.warningBanner}>
              <span>{warningMessage}</span>
            </div>
          )}

          {error && (
            <div className={styles.errorBanner}>
              <span>{error}</span>
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={
                isDangerous ? styles.dangerButton : styles.confirmButton
              }
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ConfirmationModal);
