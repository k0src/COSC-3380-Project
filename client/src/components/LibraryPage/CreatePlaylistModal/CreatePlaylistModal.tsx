import { useState, memo, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { UUID, VisibilityStatus } from "@types";
import { playlistApi } from "@api";
import {
  SettingsInput,
  SettingsImageUpload,
  SettingsTextArea,
  SettingsToggle,
} from "@components";
import styles from "./CreatePlaylistModal.module.css";
import { LuX } from "react-icons/lu";

type CreatePlaylistModalProps =
  | {
      mode: "create";
      userId: UUID;
      artistId?: never;
      artistName?: never;
      username: string;
      isOpen: boolean;
      onClose: () => void;
      onPlaylistCreated?: () => void;
      adminMode?: boolean;
    }
  | {
      mode: "createArtist";
      userId: UUID;
      artistId: UUID;
      artistName: UUID;
      username?: never;
      isOpen: boolean;
      onClose: () => void;
      onPlaylistCreated?: () => void;
      adminMode?: never;
    };

interface CreatePlaylistForm {
  title: string;
  description: string;
  visibilityStatus: VisibilityStatus;
  image?: File | null;
  removeImage?: boolean;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  mode = "create",
  userId,
  artistId,
  artistName,
  username,
  isOpen,
  onClose,
  onPlaylistCreated,
  adminMode = false,
}) => {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const initialFormState: CreatePlaylistForm = useMemo(() => {
    if (mode === "createArtist") {
      return {
        title: `${artistName} - Artist Playlist`,
        description: `Official playlist by ${artistName}`,
        visibilityStatus: "PUBLIC",
        image: null,
        removeImage: false,
      };
    }
    return {
      title: `${username}'s Playlist`,
      description: "",
      visibilityStatus: "PUBLIC",
      image: null,
      removeImage: false,
    };
  }, [mode, username, artistName]);

  const [playlistForm, setPlaylistForm] = useState<CreatePlaylistForm>(
    () => initialFormState
  );
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setPlaylistForm(initialFormState);
  }, [initialFormState]);

  useEffect(() => {
    const isFormDirty =
      playlistForm.title !== initialFormState.title ||
      playlistForm.description !== initialFormState.description ||
      playlistForm.visibilityStatus !== initialFormState.visibilityStatus ||
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
    setPlaylistForm((prev) => ({
      ...prev,
      visibilityStatus: checked ? "PUBLIC" : "PRIVATE",
    }));
  };

  const handleSubmit = useCallback(
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
          title: playlistForm.title.trim(),
          description: playlistForm.description.trim(),
          visibility_status: playlistForm.visibilityStatus,
          owner_id: userId,
        };

        if (mode === "createArtist") {
          playlistData.artist_id = artistId;
        }

        if (playlistForm.removeImage) {
          playlistData.image_url = null;
        } else if (playlistForm.image) {
          playlistData.image_url = playlistForm.image;
        }

        await playlistApi.create(playlistData);

        onPlaylistCreated?.();
        onClose();

        if (mode === "create") {
          navigate(`/library/playlists`);
        }
      } catch (error: any) {
        console.error("Create playlist error:", error);
        const errorMessage = error.response?.data?.error || "Creation failed";
        setError(errorMessage);
      } finally {
        setIsCreating(false);
      }
    },
    [mode, userId, artistId, playlistForm, onClose, navigate, onPlaylistCreated]
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
      setPlaylistForm(initialFormState);
      setIsDirty(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>
            {mode === "createArtist"
              ? "Create Artist Playlist"
              : "Create Playlist"}
          </span>
          <button className={styles.headerButton} onClick={onClose}>
            <LuX />
          </button>
        </div>
        <form className={styles.playlistForm} onSubmit={handleSubmit}>
          <SettingsInput
            label="Playlist Title"
            name="title"
            value={playlistForm.title}
            onChange={handleFormChange}
            placeholder={adminMode ? "Enter Playlist Title" : "My Playlist"}
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
            hint={
              adminMode
                ? "Enter a description for the playlist (optional)."
                : "Enter a description for your playlist (optional)."
            }
            error={error}
          />
          <SettingsToggle
            label="Playlist Privacy"
            name="visibilityStatus"
            checked={playlistForm.visibilityStatus === "PUBLIC"}
            onChange={handlePrivacyChange}
            disabled={isCreating}
            values={{ on: "Public", off: "Private" }}
          />
          <SettingsImageUpload
            label="Playlist Image"
            currentImage={undefined}
            onImageChange={handleImageChange}
            type="music"
            disabled={isCreating}
            alt="Playlist Image Preview"
            hint={
              adminMode
                ? "Upload an image for the playlist (optional)."
                : "Upload an image for your playlist (optional)."
            }
          />
          <div className={styles.buttonContainer}>
            {isDirty && !error && (
              <span className={styles.unsavedText}>
                You have unsaved changes.
              </span>
            )}
            {error && <span className={styles.error}>{error}</span>}
            <div className={styles.buttons}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Playlist"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(CreatePlaylistModal);
