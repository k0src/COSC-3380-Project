import { memo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "@api";
import { useAsyncData } from "@hooks";
import { formatNumber } from "@util";
import Logo from "@assets/logo.svg?react";
import styles from "./UploadPromptModal.module.css";
import { LuX } from "react-icons/lu";

export interface UploadPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadPromptModal: React.FC<UploadPromptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  const { data } = useAsyncData(
    {
      userCount: () => userApi.getUserCount(),
    },
    [],
    { cacheKey: "landing_page_user_count" }
  );

  const userCount = data?.userCount ?? 0;

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

  const handleLogIn = useCallback(() => {
    navigate("/login");
    onClose();
  }, [navigate, onClose]);

  const handleSignUp = useCallback(() => {
    navigate("/signup?artist=true");
    onClose();
  }, [navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <div className={styles.side}></div>
            <Logo className={styles.logo} />
            <div className={styles.side}>
              <button className={styles.closeButton} onClick={onClose}>
                <LuX />
              </button>
            </div>
          </div>
          <div className={styles.headerBottom}>
            <span className={styles.title}>Ready to share your music?</span>
            <span className={styles.modalText}>
              Join over{" "}
              <span className={styles.accentText}>
                {formatNumber(userCount)} artists
              </span>{" "}
              who use CoogMusic to share their music with the world.
            </span>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.buttonGroup}>
            <button className={styles.signUpButton} onClick={handleSignUp}>
              Create Artist Account
            </button>
            <button className={styles.logInButton} onClick={handleLogIn}>
              Log In
            </button>
          </div>
          <span className={styles.modalTextSmall}>
            Log in, or create an{" "}
            <span className={styles.accentText}>artist account</span> to start
            uploading your tracks today.
          </span>
        </div>
      </div>
    </div>
  );
};

export default memo(UploadPromptModal);
