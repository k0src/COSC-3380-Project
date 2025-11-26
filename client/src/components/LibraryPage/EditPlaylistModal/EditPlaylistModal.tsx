import { useState, memo, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import type { LibraryPlaylist, Playlist, VisibilityStatus } from "@types";
import { playlistApi } from "@api";
import {
  SettingsInput,
  SettingsImageUpload,
  SettingsTextArea,
  SettingsToggle,
  ConfirmationModal,
} from "@components";
import styles from "./EditPlaylistModal.module.css";
import { LuX } from "react-icons/lu";

type EditPlaylistModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistUpdated?: () => void;
  playlist: LibraryPlaylist | Playlist;
  adminMode?: boolean;
};

interface EditPlaylistForm {
  title: string;
  description: string;
  visibilityStatus: VisibilityStatus;
  image?: File | null;
  removeImage?: boolean;
}

const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({
  isOpen,
  onClose,
  onPlaylistUpdated,
  playlist,
  adminMode = false,
}) => {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const initialFormState: EditPlaylistForm = useMemo(() => {
    return {
      title: playlist.title,
      description: playlist.description || "",
      visibilityStatus:
        playlist.visibility_status === "PUBLIC" ? "PUBLIC" : "PRIVATE",
      image: null,
      removeImage: false,
    };
  }, [playlist]);

  const [playlistForm, setPlaylistForm] = useState<EditPlaylistForm>(
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

      setIsUpdating(true);
      setError("");

      try {
        const playlistData: any = {
          title: playlistForm.title.trim(),
          description: playlistForm.description.trim(),
          visibility_status: playlistForm.visibilityStatus,
          owner_id: playlist.owner_id,
        };

        if (playlistForm.removeImage) {
          playlistData.image_url = null;
        } else if (playlistForm.image) {
          playlistData.image_url = playlistForm.image;
        }

        await playlistApi.update(playlist.id, playlistData);

        onPlaylistUpdated?.();
        onClose();
      } catch (error: any) {
        console.error("Update playlist error:", error);
        const errorMessage = error.response?.data?.error || "Update failed";
        setError(errorMessage);
      } finally {
        setIsUpdating(false);
      }
    },
    [playlist, playlistForm, onClose, onPlaylistUpdated]
  );

  const handleDeletePlaylist = useCallback(async () => {
    setIsUpdating(true);
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
      setIsUpdating(false);
    }
  }, [playlist, onClose, navigate]);

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

  const unlisted = useMemo(
    () => !adminMode && playlist && playlist.visibility_status === "UNLISTED",
    [adminMode, playlist]
  );

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
            <span className={styles.title}>Edit Playlist</span>
            <button className={styles.headerButton} onClick={onClose}>
              <LuX />
            </button>
          </div>
          <form className={styles.playlistForm} onSubmit={handleSubmit}>
            {unlisted && (
              <div className={styles.unlistedMessage}>
                Your playlist has been unlisted due to admin action or
                auto-moderation. You may appeal this decision by{" "}
                <Link
                  to={`/appeals/playlists/${playlist!.id}`}
                  className={styles.unlistedLink}
                >
                  submitting an appeal request
                </Link>
                .
              </div>
            )}

            <SettingsInput
              label="Playlist Title"
              name="title"
              value={playlistForm.title}
              onChange={handleFormChange}
              placeholder={adminMode ? "Enter Playlist Title" : "My Playlist"}
              error={error}
              disabled={isUpdating}
            />
            <SettingsTextArea
              label="Description"
              name="description"
              value={playlistForm.description}
              onChange={handleFormChange}
              placeholder="My favorite songs..."
              disabled={isUpdating}
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
              disabled={isUpdating || unlisted}
              values={{ on: "Public", off: "Private" }}
            />
            <SettingsImageUpload
              label="Playlist Image"
              currentImage={playlist.image_url}
              onImageChange={handleImageChange}
              type="music"
              disabled={isUpdating}
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
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Deleting..." : "Delete Playlist"}
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isUpdating || !isDirty}
                >
                  {isUpdating ? "Updating..." : "Update Playlist"}
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

export default memo(EditPlaylistModal);
