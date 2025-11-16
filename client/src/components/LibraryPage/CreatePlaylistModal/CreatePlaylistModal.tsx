import { useState, memo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { UUID } from "@types";
import { playlistApi } from "@api";
import {
  SettingsInput,
  SettingsImageUpload,
  SettingsTextArea,
  SettingsToggle,
} from "@components";
import styles from "./CreatePlaylistModal.module.css";
import { LuX } from "react-icons/lu";

export interface CreatePlaylistModalProps {
  userId: UUID;
  username: string;
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated?: () => void;
}

interface CreatePlaylistForm {
  title: string;
  description: string;
  isPublic: boolean;
  image?: File | null;
  removeImage?: boolean;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  userId,
  username,
  isOpen,
  onClose,
  onPlaylistCreated,
}) => {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const initialFormState: CreatePlaylistForm = {
    title: `${username}'s Playlist`,
    description: "",
    isPublic: true,
    image: null,
    removeImage: false,
  };

  const [playlistForm, setPlaylistForm] =
    useState<CreatePlaylistForm>(initialFormState);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const isFormDirty =
      playlistForm.title !== initialFormState.title ||
      playlistForm.description !== initialFormState.description ||
      playlistForm.isPublic !== initialFormState.isPublic ||
      playlistForm.image !== initialFormState.image ||
      playlistForm.removeImage === true;
    setIsDirty(isFormDirty);
  }, [playlistForm]);

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setPlaylistForm((prev) => ({
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

  const handleImageChange = useCallback(
    (file: File | null) => {
      if (file === null) {
        setPlaylistForm((prev) => ({
          ...prev,
          image: null,
          removeImage: true,
        }));
      } else {
        setPlaylistForm((prev) => ({
          ...prev,
          image: file,
          removeImage: false,
        }));
        if (error) {
          setError("");
        }
      }
    },
    [error]
  );

  const handlePrivacyChange = (checked: boolean) => {
    setPlaylistForm((prev) => ({ ...prev, isPublic: checked }));
    if (error) {
      setError("");
    }
  };

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!playlistForm.title.trim()) {
        setError("Playlist title cannot be empty");
        return;
      }

      setIsCreating(true);
      setError("");

      try {
        const playlistData: any = {
          created_by: userId,
          title: playlistForm.title.trim(),
          description: playlistForm.description.trim(),
          is_public: playlistForm.isPublic,
        };

        if (playlistForm.removeImage) {
          playlistData.image_url = null;
        } else if (playlistForm.image) {
          playlistData.image_url = playlistForm.image;
        }

        await playlistApi.create(playlistData);
        onPlaylistCreated?.();
        onClose();
        navigate(`/library/playlists`);
      } catch (error: any) {
        console.error("Create playlist error:", error);
        const errorMessage = error.response?.data?.error || "Creation failed";
        setError(errorMessage);
      } finally {
        setIsCreating(false);
      }
    },
    [userId, playlistForm, onClose, navigate, onPlaylistCreated]
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Create Playlist</span>
          <button className={styles.headerButton} onClick={onClose}>
            <LuX />
          </button>
        </div>
        <form className={styles.playlistForm} onSubmit={handleCreate}>
          <SettingsInput
            label="Playlist Title"
            name="title"
            value={playlistForm.title}
            onChange={handleFormChange}
            placeholder="My Playlist"
            error={error}
            disabled={isCreating}
          />
          <SettingsTextArea
            label="Description"
            name="description"
            value={playlistForm.description}
            onChange={handleFormChange}
            placeholder="My favorite songs..."
            disabled={isCreating}
            hint="Enter a description for your playlist (optional)."
          />
          <SettingsToggle
            label="Playlist Privacy"
            name="isPublic"
            checked={playlistForm.isPublic}
            onChange={handlePrivacyChange}
            disabled={isCreating}
            values={{ on: "Public", off: "Private" }}
          />
          <SettingsImageUpload
            label="Playlist Image"
            onImageChange={handleImageChange}
            type="music"
            disabled={isCreating}
            hint="Upload an cover image for your playlist (optional)."
          />
          <div className={styles.buttonContainer}>
            {isDirty && !error && (
              <span className={styles.unsavedText}>
                You have unsaved changes.
              </span>
            )}
            {error && <span className={styles.unsavedText}>{error}</span>}
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Playlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(CreatePlaylistModal);
