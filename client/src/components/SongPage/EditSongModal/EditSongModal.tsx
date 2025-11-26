import { useState, memo, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Song, VisibilityStatus } from "@types";
import { formatDateString } from "@util";
import { songApi } from "@api";
import {
  SettingsInput,
  SettingsToggle,
  SettingsImageUpload,
  SettingsDatePicker,
  ConfirmationModal,
  SearchableDropdown,
  SearchableList,
} from "@components";
import styles from "./EditSongModal.module.css";
import { LuX } from "react-icons/lu";

import type { SearchableListItem } from "@components";

export interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongEdited?: () => void;
  song: Song;
  userId: string;
  adminMode?: boolean;
}

interface EditSongForm {
  title: string;
  genre: string;
  release_date: string;
  visibility_status: VisibilityStatus;
  image?: File | null;
  removeImage?: boolean;
  albumId: string;
  albumName: string;
  artists: SearchableListItem[];
}

const EditSongModal: React.FC<EditSongModalProps> = ({
  isOpen,
  onClose,
  onSongEdited,
  song,
  userId,
  adminMode = false,
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const initialFormState: EditSongForm = useMemo(() => {
    const featuredArtists =
      song.artists
        ?.filter((a) => a.role.toLowerCase() !== "main")
        .map((a) => ({
          id: a.id,
          name: a.display_name,
          role: a.role,
        })) || [];

    const albumData = song.albums?.[0];

    return {
      title: song.title,
      genre: song.genre,
      release_date: formatDateString(song.release_date),
      visibility_status: song.visibility_status,
      image: null,
      removeImage: false,
      albumId: albumData?.id || "",
      albumName: albumData?.title || "",
      artists: featuredArtists,
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
      formState.removeImage === true ||
      formState.albumId !== initialFormState.albumId ||
      formState.artists.length !== initialFormState.artists.length ||
      formState.artists.some(
        (a, i) =>
          a.id !== initialFormState.artists[i]?.id ||
          a.role !== initialFormState.artists[i]?.role
      );
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

  const handlePrivacyChange = (checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      visibility_status: checked ? "PUBLIC" : "PRIVATE",
    }));
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

  const handleDropdownChange = useCallback(
    (name: string, value: string) => {
      setFormState((prev) => ({ ...prev, [name]: value }));
      if (error) setError("");
    },
    [error]
  );

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
        for (const artist of formState.artists) {
          if (!artist.role || artist.role.trim() === "") {
            setError("All featured artists must have a role");
            return;
          }
          if (artist.role.toLowerCase() === "main") {
            setError('Only the uploader can have the "Main" role');
            return;
          }
        }

        const songData: any = {
          owner_id: song.owner_id,
          title: formState.title.trim(),
          genre: formState.genre.trim(),
          release_date: formState.release_date.trim(),
          visibility_status: formState.visibility_status,
          album_id: formState.albumId || undefined,
          artists: JSON.stringify(formState.artists),
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

  const handleDeleteSong = useCallback(async () => {
    setIsEditing(true);
    setError("");
    try {
      await songApi.delete(song.id);
      onClose();
      navigate("/library");
    } catch (error: any) {
      console.error("Delete song error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete song";
      setError(errorMessage);
    } finally {
      setIsEditing(false);
    }
  }, [song.id, onClose, navigate]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const unlisted = useMemo(
    () => !adminMode && song.visibility_status === "UNLISTED",
    [adminMode, song.visibility_status]
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
            <span className={styles.title}>{`Edit ${song.title}`}</span>
            <button className={styles.headerButton} onClick={onClose}>
              <LuX />
            </button>
          </div>

          <form className={styles.songForm} onSubmit={handleSubmit}>
            {unlisted && (
              <div className={styles.unlistedMessage}>
                Your song has been unlisted due to admin action or
                auto-moderation. You may appeal this decision by{" "}
                <Link
                  to={`/appeals/songs/${song.id}`}
                  className={styles.unlistedLink}
                >
                  submitting an appeal request
                </Link>
                .
              </div>
            )}

            <SettingsInput
              label="Song Title"
              name="title"
              value={formState.title}
              onChange={handleFormChange}
              placeholder={adminMode ? "Enter Song Title" : "My Song"}
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
            <SettingsToggle
              label="Song Privacy"
              name="visibility_status"
              checked={formState.visibility_status === "PUBLIC"}
              onChange={handlePrivacyChange}
              disabled={isEditing || unlisted}
              values={{ on: "Public", off: "Private" }}
            />
            <SearchableDropdown
              label="Album"
              name="albumId"
              entityType="album"
              onChange={(value) => handleDropdownChange("albumId", value)}
              disabled={isEditing}
              placeholder="Select an album..."
              userId={userId}
              hint="Add this song to an existing album (Optional)"
              displayValue={formState.albumName}
            />
            <SearchableList
              label="Featured Artists"
              name="artists"
              entityType="artist"
              value={formState.artists}
              onChange={(artists) =>
                setFormState((prev) => ({ ...prev, artists }))
              }
              userId={userId}
              disabled={isEditing}
              placeholder="Search for artists..."
              secondaryField={{
                name: "role",
                label: "Role",
                placeholder: "e.g., Featured, Producer",
              }}
              hint="Add featured artists and specify their roles. You must be mutal followers with them (Optional)"
            />
            <SettingsImageUpload
              label="Cover Image"
              currentImage={song.image_url || undefined}
              onImageChange={handleImageChange}
              type="music"
              disabled={isEditing}
              alt="Song Cover Image Preview"
              hint={
                adminMode
                  ? "Upload a cover image for the song (Optional)"
                  : "Upload a cover image for your song (optional)."
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
                  {isEditing ? "Deleting..." : "Delete Song"}
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isEditing || !isDirty}
                >
                  {isEditing ? "Updating..." : "Update Song"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSong}
        title="Delete Song"
        message="Are you sure you want to permanently delete this song? This action cannot be undone."
        confirmButtonText="Delete Song"
        isDangerous={true}
      />
    </>
  );
};

export default memo(EditSongModal);
