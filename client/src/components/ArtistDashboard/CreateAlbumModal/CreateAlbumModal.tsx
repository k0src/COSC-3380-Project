import { useState, memo, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { UUID, Album, VisibilityStatus } from "@types";
import { albumApi } from "@api";
import {
  SettingsInput,
  SettingsImageUpload,
  ConfirmationModal,
  SettingsRadio,
  SettingsDatePicker,
} from "@components";
import styles from "./CreateAlbumModal.module.css";
import { LuX } from "react-icons/lu";

export type CreateAlbumModalProps =
  | {
      mode: "create";
      userId: UUID;
      artistId: UUID;
      isOpen: boolean;
      onClose: () => void;
      onAlbumCreated: (album: Album) => void;
      album?: never;
    }
  | {
      mode: "edit";
      userId: UUID;
      artistId: UUID;
      isOpen: boolean;
      onClose: () => void;
      onAlbumCreated?: never;
      album: Album;
    };

interface CreateAlbumForm {
  title: string;
  releaseDate: string;
  genre: string;
  visibilityStatus: "PUBLIC" | "PRIVATE" | "UNLISTED";
  image?: File | null;
  removeImage?: boolean;
}

const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  mode = "create",
  userId,
  artistId,
  isOpen,
  onClose,
  onAlbumCreated,
  album,
}) => {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const initialFormState: CreateAlbumForm = useMemo(() => {
    if (mode === "edit" && album) {
      return {
        title: album.title,
        releaseDate: album.release_date,
        genre: album.genre,
        visibilityStatus: album.visibility_status,
        image: null,
        removeImage: false,
      };
    }
    return {
      title: "",
      releaseDate: new Date().toISOString().split("T")[0],
      genre: "",
      visibilityStatus: "PUBLIC",
      image: null,
      removeImage: false,
    };
  }, [mode, album]);

  const [formState, setFormState] = useState<CreateAlbumForm>(
    () => initialFormState
  );

  useEffect(() => {
    setFormState(initialFormState);
  }, [initialFormState, isOpen]);

  useEffect(() => {
    const isFormDirty =
      formState.title !== initialFormState.title ||
      formState.releaseDate !== initialFormState.releaseDate ||
      formState.genre !== initialFormState.genre ||
      formState.visibilityStatus !== initialFormState.visibilityStatus ||
      formState.image !== initialFormState.image ||
      formState.removeImage !== initialFormState.removeImage;
    setIsDirty(isFormDirty);
  }, [formState, initialFormState]);

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
        setError("Album title cannot be empty.");
        return;
      }

      if (!formState.releaseDate) {
        setError("Release date is required.");
        return;
      }

      if (!formState.genre.trim()) {
        setError("Genre cannot be empty.");
        return;
      }

      setIsCreating(true);
      setError("");

      try {
        const albumData: any = {
          title: formState.title.trim(),
          release_date: formState.releaseDate,
          genre: formState.genre.trim(),
          visibility_status: formState.visibilityStatus,
          created_by: artistId,
        };

        if (mode === "create") {
          albumData.owner_id = userId;
        }

        if (formState.removeImage) {
          albumData.image_url = null;
        } else if (formState.image) {
          albumData.image_url = formState.image;
        }

        if (mode === "edit" && album) {
          await albumApi.update(album.id, albumData);
        } else {
          const newAlbum = await albumApi.create(albumData);
          onAlbumCreated?.(newAlbum);
        }

        onClose();
      } catch (error: any) {
        console.error(
          `${mode === "edit" ? "Update" : "Create"} album error:`,
          error
        );
        const errorMessage =
          error.response?.data?.error ||
          `${mode === "edit" ? "Update" : "Creation"} failed`;
        setError(errorMessage);
      } finally {
        setIsCreating(false);
      }
    },
    [mode, formState, userId, album, onAlbumCreated, onClose]
  );

  const handleDeleteAlbum = useCallback(async () => {
    if (mode !== "edit" || !album) return;
    setIsCreating(true);
    setError("");
    try {
      await albumApi.delete(album.id);
      onClose();
    } catch (error: any) {
      console.error("Delete album error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete album";
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [mode, album, onClose, navigate]);

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
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <span className={styles.title}>
              {mode === "edit" ? "Edit Album" : "Create Album"}
            </span>
            <button className={styles.headerButton} onClick={onClose}>
              <LuX />
            </button>
          </div>
          <form className={styles.albumForm} onSubmit={handleSubmit}>
            <SettingsInput
              label="Album Title"
              name="title"
              value={formState.title}
              onChange={handleFormChange}
              placeholder="My Album"
              error={error}
              disabled={isCreating}
              required={true}
            />
            <SettingsInput
              label="Genre"
              name="genre"
              value={formState.genre}
              onChange={handleFormChange}
              placeholder="Pop, Hip-Hop, Rock..."
              error={error}
              disabled={isCreating}
              required={true}
            />
            <SettingsDatePicker
              label="Release Date"
              name="release_date"
              value={formState.releaseDate}
              onChange={handleDateChange}
              placeholder="YYYY-MM-DD"
              error={error}
              disabled={isCreating}
              max={today}
            />
            <SettingsRadio
              label="Visibility"
              name="visibility_status"
              value={formState.visibilityStatus}
              onChange={handleVisibilityChange}
              options={[
                { label: "Public", value: "PUBLIC" },
                { label: "Private", value: "PRIVATE" },
                { label: "Unlisted", value: "UNLISTED" },
              ]}
              disabled={isCreating}
            />
            <SettingsImageUpload
              label="Cover Image"
              currentImage={
                mode === "edit" && album ? album.image_url : undefined
              }
              onImageChange={handleImageChange}
              type="music"
              disabled={isCreating}
              alt="Album Cover Image Preview"
              hint="Upload a cover image for your album (optional)."
            />
            <div className={styles.buttonContainer}>
              {isDirty && !error && (
                <span className={styles.unsavedText}>
                  You have unsaved changes.
                </span>
              )}
              {error && <span className={styles.unsavedText}>{error}</span>}
              <div className={styles.buttons}>
                {mode === "edit" && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => setIsDeleteModalOpen(true)}
                    disabled={isCreating}
                  >
                    {isCreating ? "Deleting..." : "Delete Album"}
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isCreating || (mode === "edit" && !isDirty)}
                >
                  {isCreating
                    ? mode === "edit"
                      ? "Updating..."
                      : "Creating..."
                    : mode === "edit"
                    ? "Update Album"
                    : "Create Album"}
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

export default memo(CreateAlbumModal);
