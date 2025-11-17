import { useState, memo, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { UUID, LibraryPlaylist, Playlist } from "@types";
import { playlistApi } from "@api";
import {
  SettingsInput,
  SettingsImageUpload,
  SettingsTextArea,
  SettingsToggle,
  ConfirmationModal,
} from "@components";
import styles from "./CreatePlaylistModal.module.css";
import { LuX } from "react-icons/lu";

type CreatePlaylistModalProps =
  | {
      mode?: "create";
      userId: UUID;
      username: string;
      isOpen: boolean;
      onClose: () => void;
      onPlaylistCreated?: () => void;
      playlist?: never;
    }
  | {
      mode: "edit";
      userId?: never;
      username?: never;
      isOpen: boolean;
      onClose: () => void;
      onPlaylistCreated?: () => void;
      playlist: LibraryPlaylist | Playlist;
    };

interface CreatePlaylistForm {
  title: string;
  description: string;
  isPublic: boolean;
  image?: File | null;
  removeImage?: boolean;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  mode = "create",
  userId,
  username,
  isOpen,
  onClose,
  onPlaylistCreated,
  playlist,
}) => {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const initialFormState: CreatePlaylistForm = useMemo(() => {
    if (mode === "edit" && playlist) {
      return {
        title: playlist.title,
        description: playlist.description || "",
        isPublic: playlist.is_public,
        image: null,
        removeImage: false,
      };
    }
    return {
      title: `${username}'s Playlist`,
      description: "",
      isPublic: true,
      image: null,
      removeImage: false,
    };
  }, [mode, playlist, username]);

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
          is_public: playlistForm.isPublic,
        };

        if (mode === "create") {
          playlistData.created_by = userId;
        }

        if (playlistForm.removeImage) {
          playlistData.image_url = null;
        } else if (playlistForm.image) {
          playlistData.image_url = playlistForm.image;
        }

        if (mode === "edit" && playlist) {
          await playlistApi.update(playlist.id, playlistData);
        } else {
          await playlistApi.create(playlistData);
        }

        onPlaylistCreated?.();
        onClose();

        if (mode === "create") {
          navigate(`/library/playlists`);
        }
      } catch (error: any) {
        console.error(
          `${mode === "edit" ? "Update" : "Create"} playlist error:`,
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
    [mode, userId, playlist, playlistForm, onClose, navigate, onPlaylistCreated]
  );

  const handleDeletePlaylist = useCallback(async () => {
    if (mode !== "edit" || !playlist) return;
    setIsCreating(true);
    setError("");
    try {
      await playlistApi.delete(playlist.id);
      onClose();
      navigate(`/library/playlists`);
    } catch (error: any) {
      console.error("Delete playlist error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete playlist";
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [mode, playlist, onClose, navigate]);

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
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <span className={styles.title}>
              {mode === "edit" ? "Edit Playlist" : "Create Playlist"}
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
              currentImage={
                mode === "edit" && playlist ? playlist.image_url : undefined
              }
              onImageChange={handleImageChange}
              type="music"
              disabled={isCreating}
              alt="Playlist Image Preview"
              hint="Upload an cover image for your playlist (optional)."
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
                    {isCreating ? "Deleting..." : "Delete Playlist"}
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
                    ? "Update Playlist"
                    : "Create Playlist"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePlaylist}
        title="Delete Playlist"
        message="Are you sure you want to permanently delete this playlist? This action cannot be undone."
        confirmButtonText="Delete Playlist"
        isDangerous={true}
      />
    </>
  );
};

export default memo(CreatePlaylistModal);
