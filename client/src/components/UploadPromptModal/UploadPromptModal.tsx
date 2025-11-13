import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import styles from "./UploadPromptModal.module.css";

interface UploadPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadPromptModal: React.FC<UploadPromptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose();
    navigate("/login", { state: { redirectTo: "/upload" } });
  };

  const handleSignUp = () => {
    onClose();
    navigate("/signup", { 
      state: { 
        role: "ARTIST",
        redirectTo: "/upload" 
      } 
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        {!isAuthenticated ? (
          <>
            <h2>Ready to Share Your Music?</h2>
            <p>Sign in as an artist to start uploading your tracks.</p>
            
            <div className={styles.buttonGroup}>
              <button className={styles.primaryBtn} onClick={handleSignIn}>
                Sign In as Artist
              </button>
              <button className={styles.secondaryBtn} onClick={handleSignUp}>
                Create Artist Account
              </button>
            </div>

            <p className={styles.note}>
              New to CoogMusic? Create a free artist account and start uploading your music today!
            </p>
          </>
        ) : user?.role !== "ARTIST" && user?.role !== "ADMIN" ? (
          <>
            <h2>Artists Only</h2>
            <p>
              Only artist accounts can upload music. Your current account is set up as a regular user.
            </p>
            <p className={styles.note}>
              To upload, please create a new artist account.
            </p>

            <button className={styles.primaryBtn} onClick={handleSignUp}>
              Create Artist Account
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default UploadPromptModal;
