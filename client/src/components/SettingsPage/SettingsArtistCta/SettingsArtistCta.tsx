import { memo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@types";
import { ArtistSignupModal } from "@components";
import styles from "./SettingsArtistCta.module.css";
import { LuX } from "react-icons/lu";

export interface SettingsArtistCtaProps {
  user: User;
}

const SettingsArtistCta: React.FC<SettingsArtistCtaProps> = ({ user }) => {
  const navigate = useNavigate();

  const [isVisible, setIsVisible] = useState(true);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("settings-artist-cta-dismissed");
    if (isDismissed) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem("settings-artist-cta-dismissed", "true");
  }, []);

  const handleOpenModal = useCallback(() => {
    setIsSignupModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsSignupModalOpen(false);
  }, []);

  const handleSignupSuccess = useCallback(
    (updatedUser?: User) => {
      navigate(`/artists/${updatedUser?.artist_id}`);
    },
    [navigate]
  );

  if (!isVisible) return null;

  return (
    <>
      <div className={styles.artistCtaSection}>
        <div className={styles.artistCtaBanner}>
          <div className={styles.artistCtaBannerContent}>
            <div className={styles.artistCtaTextContainer}>
              <span className={styles.artistCtaTitle}>Become an Artist!</span>
              <span className={styles.artistCtaDescription}>
                Register to become a CoogMusic artist to upload songs, create
                playlists, and more.
              </span>
            </div>
            <button
              className={styles.artistCtaButton}
              onClick={handleOpenModal}
            >
              Sign Up as an Artist
            </button>
          </div>
          <button
            className={styles.artistCtaDismissButton}
            onClick={handleClose}
          >
            <LuX />
          </button>
        </div>
      </div>

      <ArtistSignupModal
        isOpen={isSignupModalOpen}
        onClose={handleCloseModal}
        user={user}
        onSignupSuccess={handleSignupSuccess}
      />
    </>
  );
};

export default memo(SettingsArtistCta);
