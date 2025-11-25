import { useState, memo, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@types";
import { SettingsInput, SettingsTextArea } from "@components";
import { userApi } from "@api";
import styles from "./ArtistSignupModal.module.css";
import { LuX } from "react-icons/lu";

export interface ArtistSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess?: (user?: User) => void;
  user: User;
}

interface ArtistFormData {
  displayName?: string;
  location?: string;
  bio?: string;
}

const ArtistSignupModal: React.FC<ArtistSignupModalProps> = ({
  isOpen,
  onClose,
  onSignupSuccess,
  user,
}) => {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState: ArtistFormData = useMemo(() => {
    return {
      displayName: user.username || "",
      location: "",
      bio: "",
    };
  }, [user.username]);

  const [formState, setFormState] = useState<ArtistFormData>(
    () => initialFormState
  );

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormState((prev) => ({ ...prev, [name]: value }));
      if (error) {
        setError("");
      }
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setIsSubmitting(true);
      setError("");

      try {
        const updatedUser = await userApi.registerArtist(
          user.id,
          user.username,
          formState.displayName || user.username,
          formState.location || "",
          formState.bio || ""
        );

        onSignupSuccess?.(updatedUser);
        onClose();
      } catch (error: any) {
        console.error("Artist signup failed:", error);
        const errorMessage =
          error?.response?.data?.error || "Signup failed. Please try again.";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, onClose, onSignupSuccess, user.id, user.username]
  );

  const handleViewProfile = useCallback(() => {
    if (user.artist_id) {
      navigate(`/artist/${user.artist_id}`);
    }
  }, [navigate, user.artist_id]);

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
      setFormState(initialFormState);
    }
  }, [isOpen, initialFormState]);

  if (!isOpen) return null;

  if (user.role === "ARTIST" && user.artist_id) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <span className={styles.title}>Already an Artist</span>
            <button className={styles.headerButton} onClick={onClose}>
              <LuX />
            </button>
          </div>
          <div className={styles.messageContainer}>
            <div className={styles.message}>
              <span>
                You are already registered as an artist on CoogMusic. No need to
                sign up again!
              </span>
            </div>
          </div>
          <div className={styles.artistForm}>
            <div className={styles.buttonContainer}>
              <div className={styles.buttons}>
                <button
                  className={styles.saveButton}
                  onClick={handleViewProfile}
                >
                  View Artist Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Sign Up as an Artist</span>
          <button className={styles.headerButton} onClick={onClose}>
            <LuX />
          </button>
        </div>

        <div className={styles.messageContainer}>
          <div className={styles.messageBanner}>
            <span>
              You're on your way to becoming an artist on CoogMusic! You can
              choose a display name, set your location, and add a bio to let
              listeners know more about you. Otherwise, you can skip this step
              and edit your artist profile later.
            </span>
          </div>
        </div>

        <form className={styles.artistForm} onSubmit={handleSubmit}>
          <SettingsInput
            label="Display Name"
            name="displayName"
            value={formState.displayName || ""}
            onChange={handleFormChange}
            placeholder="Display Name"
            error={error}
            disabled={isSubmitting}
          />

          <SettingsInput
            label="Location"
            name="location"
            value={formState.location || ""}
            onChange={handleFormChange}
            placeholder="Location"
            error={error}
            disabled={isSubmitting}
          />

          <SettingsTextArea
            label="Bio"
            name="bio"
            value={formState.bio || ""}
            onChange={handleFormChange}
            placeholder="Tell us about yourself"
            error={error}
            disabled={isSubmitting}
          />
          <div className={styles.buttonContainer}>
            {error && <span className={styles.unsavedText}>{error}</span>}
            <div className={styles.buttons}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(ArtistSignupModal);
