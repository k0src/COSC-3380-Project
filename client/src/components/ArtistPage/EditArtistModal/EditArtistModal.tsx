import { useState, memo, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Artist } from "@types";
import { artistApi } from "@api";
import {
  SettingsInput,
  SettingsImageUpload,
  SettingsTextArea,
} from "@components";
import styles from "./EditArtistModal.module.css";
import { LuX } from "react-icons/lu";

export interface EditArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArtistEdited?: () => void;
  artist: Artist;
}

interface EditArtistForm {
  display_name: string;
  bio: string;
  location: string;
  banner_image?: File | null;
  removeBannerImage?: boolean;
}

const EditArtistModal: React.FC<EditArtistModalProps> = ({
  isOpen,
  onClose,
  onArtistEdited,
  artist,
}) => {
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const initialFormState: EditArtistForm = useMemo(() => {
    return {
      display_name: artist.display_name,
      bio: artist.bio,
      location: artist.location || "",
      banner_image: null,
      removeBannerImage: false,
    };
  }, [artist]);

  const [formState, setFormState] = useState<EditArtistForm>(
    () => initialFormState
  );

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormState(initialFormState);
  }, [initialFormState]);

  useEffect(() => {
    const isFormDirty =
      formState.display_name !== initialFormState.display_name ||
      formState.bio !== initialFormState.bio ||
      formState.location !== initialFormState.location ||
      formState.banner_image !== initialFormState.banner_image ||
      formState.removeBannerImage === true;
    setIsDirty(isFormDirty);
  }, [formState]);

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setFormState((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
      if (error) {
        setError("");
      }
    },
    [error]
  );

  const handleBannerImageChange = useCallback(
    (file: File | null) => {
      if (file === null) {
        setFormState((prev) => ({
          ...prev,
          banner_image: null,
          removeBannerImage: true,
        }));
      } else {
        setFormState((prev) => ({
          ...prev,
          banner_image: file,
          removeBannerImage: false,
        }));
        if (error) {
          setError("");
        }
      }
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formState.display_name.trim()) {
        setError("Display name cannot be empty");
        return;
      }

      setIsEditing(true);
      setError("");

      try {
        const artistData: any = {
          display_name: formState.display_name.trim(),
          bio: formState.bio.trim(),
          location: formState.location.trim(),
        };

        if (formState.removeBannerImage) {
          artistData.banner_image_url = null;
        } else if (formState.banner_image) {
          artistData.banner_image_url = formState.banner_image;
        }

        await artistApi.update(artist.id, artistData);

        onArtistEdited?.();
        onClose();
      } catch (error: any) {
        console.error("Error editing artist:", error);
        const errorMessage =
          error.response?.data?.error || "Failed to edit artist";
        setError(errorMessage);
      } finally {
        setIsEditing(false);
      }
    },
    [formState, onClose, onArtistEdited, artist.id]
  );

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
      setIsDirty(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Edit artist details</span>
          <button className={styles.headerButton} onClick={onClose}>
            <LuX />
          </button>
        </div>

        <form className={styles.artistForm} onSubmit={handleSubmit}>
          <SettingsInput
            label="Display Name"
            name="display_name"
            value={formState.display_name}
            onChange={handleFormChange}
            placeholder="Artist Name"
            error={error}
            disabled={isEditing}
          />
          <SettingsTextArea
            label="Artist Bio"
            name="bio"
            value={formState.bio}
            onChange={handleFormChange}
            placeholder="Tell us about yourself..."
            error={error}
            disabled={isEditing}
            height="medium"
            hint="Enter a bio for your artist profile (optional). Max 500 characters."
          />
          <SettingsInput
            label="Location"
            name="location"
            value={formState.location}
            onChange={handleFormChange}
            placeholder="Location"
            error={error}
            disabled={isEditing}
            hint="Enter your location (optional)."
          />
          <SettingsImageUpload
            label="Banner Image"
            currentImage={artist?.banner_image_url || undefined}
            onImageChange={handleBannerImageChange}
            type="banner"
            disabled={isEditing}
            alt="Banner Image Preview"
            hint="Upload a banner image for your artist profile (optional). Recommended size: 1700x300 pixels."
          />
          <div className={styles.buttonContainer}>
            {isDirty && !error && (
              <span className={styles.unsavedText}>
                You have unsaved changes.
              </span>
            )}
            {error && <span className={styles.unsavedText}>{error}</span>}
            <div className={styles.buttons}>
              <Link to="/me/settings" className={styles.deactivateLink}>
                Deactivate Artist Page
              </Link>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={isEditing || !isDirty}
              >
                {isEditing ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(EditArtistModal);
