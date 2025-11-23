import { useState, memo, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Album, VisibilityStatus } from "@types";
import { formatDateString } from "@util";
import { albumApi } from "@api";
import {
  SettingsInput,
  SettingsToggle,
  SettingsImageUpload,
  SettingsDatePicker,
  ConfirmationModal,
} from "@components";
import styles from "./EditAlbumModal.module.css";
import { LuX } from "react-icons/lu";

export interface EditAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlbumEdited?: () => void;
  album: Album;
  adminMode?: boolean;
}

interface EditAlbumForm {
  title: string;
  genre: string;
  releaseDate: string;
  visibilityStatus: VisibilityStatus;
  image?: File | null;
  removeImage?: boolean;
}

const EditAlbumModal: React.FC<EditAlbumModalProps> = ({
  isOpen,
  onClose,
  onAlbumEdited,
  album,
  adminMode = false,
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const initialFormState: EditAlbumForm = useMemo(() => {
    return {
      title: album.title,
      genre: album.genre,
      releaseDate: formatDateString(album.release_date),
      visibilityStatus: album.visibility_status,
      image: null,
      removeImage: false,
    };
  }, [album]);

  const [formState, setFormState] = useState(() => initialFormState);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormState(initialFormState);
  }, [initialFormState]);

  useEffect(() => {
    const isFormDirty =
      formState.title !== initialFormState.title ||
      formState.genre !== initialFormState.genre ||
      formState.releaseDate !== initialFormState.releaseDate ||
      formState.visibilityStatus !== initialFormState.visibilityStatus ||
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

  const handlePrivacyChange = (checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      visibilityStatus: checked ? "PUBLIC" : "PRIVATE",
    }));
  };

  const handleDateChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      releaseDate: value,
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
        const albumData: any = {
          title: formState.title.trim(),
          genre: formState.genre.trim(),
          release_date: formState.releaseDate.trim(),
          visibility_status: formState.visibilityStatus,
        };

        if (formState.removeImage) {
          albumData.image_url = null;
        } else if (formState.image) {
          albumData.image_url = formState.image;
        }

        await albumApi.update(album.id, albumData);

        onAlbumEdited?.();
        onClose();
      } catch (error: any) {
        console.error("Error editing album:", error);
        const errorMessage =
          error.response?.data?.error || "Failed to edit album";
        setError(errorMessage);
      } finally {
        setIsEditing(false);
      }
    },
    [formState, onClose, onAlbumEdited, album.id]
  );

  const handleDeleteAlbum = useCallback(async () => {
    setIsEditing(true);
    setError("");
    try {
      await albumApi.delete(album.id);
      onClose();
      navigate("/library");
    } catch (error: any) {
      console.error("Delete album error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete album";
      setError(errorMessage);
    } finally {
      setIsEditing(false);
    }
  }, [album.id, onClose, navigate]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const unlisted = useMemo(
    () => !adminMode && album.visibility_status === "UNLISTED",
    [adminMode, album.visibility_status]
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
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <span className={styles.title}>{`Edit ${album.title}`}</span>
            <button className={styles.headerButton} onClick={onClose}>
              <LuX />
            </button>
          </div>

          <form className={styles.albumForm} onSubmit={handleSubmit}>
            {unlisted && (
              <div className={styles.unlistedMessage}>
                Your album has been unlisted due to admin action or
                auto-moderation. You may appeal this decision by{" "}
                <Link
                  to={`/appeals/albums/${album.id}`}
                  className={styles.unlistedLink}
                >
                  submitting an appeal request
                </Link>
                .
              </div>
            )}

            <SettingsInput
              label="Album Title"
              name="title"
              value={formState.title}
              onChange={handleFormChange}
              placeholder={adminMode ? "Enter Album Title" : "My Album"}
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
              name="releaseDate"
              value={formState.releaseDate}
              onChange={handleDateChange}
              placeholder="YYYY-MM-DD"
              error={error}
              disabled={isEditing}
              max={today}
            />
            <SettingsToggle
              label="Album Privacy"
              name="visibilityStatus"
              checked={formState.visibilityStatus === "PUBLIC"}
              onChange={handlePrivacyChange}
              disabled={isEditing || unlisted}
              values={{ on: "Public", off: "Private" }}
            />
            <SettingsImageUpload
              label="Cover Image"
              currentImage={album.image_url || undefined}
              onImageChange={handleImageChange}
              type="music"
              disabled={isEditing}
              alt="Album Cover Image Preview"
              hint={
                adminMode
                  ? "Upload a cover image for the album (optional)."
                  : "Upload a cover image for your album (optional)."
              }
            />
            <div className={styles.buttonContainer}>
              {isDirty && !error && (
                <span className={styles.unsavedText}>
                  You have unsaved changes.
                </span>
              )}
              {error && <span className={styles.unsavedText}>{error}</span>}
              <div className={styles.buttons}>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={isEditing}
                >
                  {isEditing ? "Deleting..." : "Delete Album"}
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isEditing || !isDirty}
                >
                  {isEditing ? "Updating..." : "Update Album"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAlbum}
        title="Delete Album"
        message="Are you sure you want to permanently delete this album? This action cannot be undone."
        confirmButtonText="Delete Album"
        isDangerous={true}
      />
    </>
  );
};

export default memo(EditAlbumModal);
