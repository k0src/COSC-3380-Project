import { useState, memo, useEffect, useCallback, useMemo } from "react";
import type { Song, VisibilityStatus } from "@types";
import { formatDateString } from "@util";
import { songApi } from "@api";
import {
  SettingsInput,
  SettingsRadio,
  SettingsImageUpload,
  SettingsDatePicker,
} from "@components";
import styles from "./EditSongModal.module.css";
import { LuX } from "react-icons/lu";

export interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongEdited?: () => void;
  song: Song;
}

// todo: add album stuff later
interface EditSongForm {
  title: string;
  genre: string;
  release_date: string;
  visibility_status: VisibilityStatus;
  image?: File | null;
  removeImage?: boolean;
}

const EditSongModal: React.FC<EditSongModalProps> = ({
  isOpen,
  onClose,
  onSongEdited,
  song,
}) => {
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const initialFormState: EditSongForm = useMemo(() => {
    return {
      title: song.title,
      genre: song.genre,
      release_date: formatDateString(song.release_date),
      visibility_status: song.visibility_status,
      image: null,
      removeImage: false,
    };
  }, [song]);

  const [formState, setFormState] = useState<EditSongForm>(
    () => initialFormState
  );

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormState(initialFormState);
  }, [initialFormState]);

  useEffect(() => {
    const isFormDirty =
      formState.title !== initialFormState.title ||
      formState.genre !== initialFormState.genre ||
      formState.release_date !== initialFormState.release_date ||
      formState.visibility_status !== initialFormState.visibility_status ||
      formState.image !== initialFormState.image ||
      formState.removeImage === true;
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

  const handleImageChange = useCallback(
    (file: File | null) => {
      if (file === null) {
        setFormState((prev) => ({
          ...prev,
          image: null,
          removeImage: true,
        }));
      } else {
        setFormState((prev) => ({
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

  const handleVisibilityChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      visibility_status: value as VisibilityStatus,
    }));
    if (error) {
      setError("");
    }
  };

  const handleDateChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      release_date: value,
    }));
    if (error) {
      setError("");
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formState.title.trim()) {
        setError("Title cannot be empty");
        return;
      }

      setIsEditing(true);
      setError("");

      try {
        const songData: any = {
          title: formState.title.trim(),
          genre: formState.genre.trim(),
          release_date: formState.release_date.trim(),
          visibility_status: formState.visibility_status,
        };

        if (formState.removeImage) {
          songData.image_url = null;
        } else if (formState.image) {
          songData.image_url = formState.image;
        }

        await songApi.update(song.id, songData);

        onSongEdited?.();
        onClose();
      } catch (error: any) {
        console.error("Error editing song:", error);
        const errorMessage =
          error.response?.data?.error || "Failed to edit song";
        setError(errorMessage);
      } finally {
        setIsEditing(false);
      }
    },
    [formState, onClose, onSongEdited, song.id]
  );

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

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
          <span className={styles.title}>{`Edit ${song.title}`}</span>
          <button className={styles.headerButton} onClick={onClose}>
            <LuX />
          </button>
        </div>

        <form className={styles.songForm} onSubmit={handleSubmit}>
          <SettingsInput
            label="Song Title"
            name="title"
            value={formState.title}
            onChange={handleFormChange}
            placeholder="My Song"
            error={error}
            disabled={isEditing}
          />
          <SettingsInput
            label="Genre"
            name="genre"
            value={formState.genre}
            onChange={handleFormChange}
            placeholder="Pop, Hip-Hop, Rock..."
            error={error}
            disabled={isEditing}
          />
          <SettingsDatePicker
            label="Release Date"
            name="release_date"
            value={formState.release_date}
            onChange={handleDateChange}
            placeholder="YYYY-MM-DD"
            error={error}
            disabled={isEditing}
            max={today}
          />
          <SettingsRadio
            label="Visibility"
            name="visibility_status"
            value={formState.visibility_status}
            onChange={handleVisibilityChange}
            options={[
              { label: "Public", value: "PUBLIC" },
              { label: "Private", value: "PRIVATE" },
              { label: "Unlisted", value: "UNLISTED" },
            ]}
            disabled={isEditing}
          />
          <SettingsImageUpload
            label="Cover Image"
            currentImage={song.image_url || undefined}
            onImageChange={handleImageChange}
            type="music"
            disabled={isEditing}
            alt="Song Cover Image Preview"
            hint="Upload a cover image for your song (optional)."
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
              disabled={isEditing || !isDirty}
            >
              {isEditing ? "Updating..." : "Update Song"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(EditSongModal);
