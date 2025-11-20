import { memo, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { songApi } from "@api";
import {
  SettingsInput,
  SettingsImageUpload,
  SettingsRadio,
  SettingsDatePicker,
  SearchableDropdown,
  SearchableList,
  CreateAlbumModal,
} from "@components";
import UploadSuccessModal from "./UploadSuccessModal/UploadSuccessModal.js";
import type { SearchableListItem } from "@components";
import styles from "./ArtistDashboardAddPage.module.css";
import { LuFileUp, LuPlus } from "react-icons/lu";
import { LuCirclePause, LuCirclePlay } from "react-icons/lu";

interface UploadForm {
  title: string;
  artists: SearchableListItem[];
  genre: string;
  releaseDate: string;
  visibilityStatus: string;
  coverImage: File | null;
  audioFile: File | null;
  albumId: string;
  albumName: string;
}

const ArtistDashboardAddPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedSongId, setUploadedSongId] = useState<string | null>(null);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);

  const initialFormState: UploadForm = useMemo(
    () => ({
      title: "",
      artists: [],
      genre: "",
      releaseDate: new Date().toISOString().split("T")[0],
      visibilityStatus: "PUBLIC",
      coverImage: null,
      audioFile: null,
      albumId: "",
      albumName: "",
    }),
    []
  );

  const [uploadForm, setUploadForm] = useState<UploadForm>(initialFormState);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (user && user.role !== "ARTIST" && user.role !== "ADMIN") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const isFormDirty =
      uploadForm.title !== initialFormState.title ||
      uploadForm.genre !== initialFormState.genre ||
      uploadForm.releaseDate !== initialFormState.releaseDate ||
      uploadForm.visibilityStatus !== initialFormState.visibilityStatus ||
      uploadForm.albumId !== initialFormState.albumId ||
      uploadForm.artists.length !== initialFormState.artists.length ||
      uploadForm.coverImage !== null ||
      uploadForm.audioFile !== null;
    setIsDirty(isFormDirty);
  }, [uploadForm, initialFormState]);

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setUploadForm((prev) => ({ ...prev, [name]: value }));
      if (error) setError("");
    },
    [error]
  );

  const handleDropdownChange = useCallback(
    (name: string, value: string) => {
      setUploadForm((prev) => ({ ...prev, [name]: value }));
      if (error) setError("");
    },
    [error]
  );

  const handleDateChange = useCallback(
    (value: string) => {
      setUploadForm((prev) => ({ ...prev, releaseDate: value }));
      if (error) setError("");
    },
    [error]
  );

  const handleCoverImageChange = useCallback(
    (file: File | null) => {
      setUploadForm((prev) => ({
        ...prev,
        coverImage: file,
      }));
      if (error) setError("");
    },
    [error]
  );

  const handleAudioFile = useCallback(
    (file: File) => {
      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        setError("Audio file must be smaller than 10 MB");
        return;
      }

      if (file.type !== "audio/mpeg" && !file.name.endsWith(".mp3")) {
        setError("Only MP3 files are supported");
        return;
      }

      setError("");
      setUploadForm((prev) => ({ ...prev, audioFile: file }));
      setUploadProgress(0);

      if (!uploadForm.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setUploadForm((prev) => ({ ...prev, title: nameWithoutExt }));
      }

      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }

      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);

      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        setAudioDuration(audio.duration);
      });
    },
    [uploadForm.title, audioPreviewUrl, error]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleAudioFile(files[0]);
      }
    },
    [handleAudioFile]
  );

  const onChooseFile = useCallback(() => {
    audioInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleAudioFile(files[0]);
      }
    },
    [handleAudioFile]
  );

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const formatDuration = useCallback((seconds: number | null) => {
    if (seconds == null || isNaN(seconds)) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!uploadForm.audioFile) {
        setError("Please select an audio file");
        return;
      }

      if (!uploadForm.title.trim()) {
        setError("Song title is required");
        return;
      }

      if (!uploadForm.genre.trim()) {
        setError("Please specify a genre");
        return;
      }

      if (!user?.id) {
        setError("Unauthorized. Please log in.");
        return;
      }

      if (!user?.artist_id) {
        setError("Artist profile not found");
        return;
      }

      for (const artist of uploadForm.artists) {
        if (!artist.role || artist.role.trim() === "") {
          setError("All featured artists must have a role");
          return;
        }
        if (artist.role.toLowerCase() === "main") {
          setError('Only the uploader can have the "Main" role');
          return;
        }
      }

      setIsUploading(true);
      setError("");
      setUploadProgress(0);

      try {
        const allArtists = [
          { id: user.artist_id, role: "Main" },
          ...uploadForm.artists,
        ];

        const songData: any = {
          title: uploadForm.title.trim(),
          owner_id: user.id,
          artists: JSON.stringify(allArtists),
          genre: uploadForm.genre.trim(),
          album_id: uploadForm.albumId || undefined,
          release_date: uploadForm.releaseDate,
          visibility_status: uploadForm.visibilityStatus,
          audio_url: uploadForm.audioFile,
        };

        if (uploadForm.coverImage) {
          songData.image_url = uploadForm.coverImage;
        }

        const song = await songApi.create(songData, (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        });
        setUploadedSongId(song.id);

        setShowSuccessModal(true);
      } catch (error: any) {
        console.error("Upload error:", error);
        const errorMessage =
          error.response?.data?.error || "Upload failed. Please try again.";
        setError(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadForm, user]
  );

  const handleReset = useCallback(() => {
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setUploadForm(initialFormState);
    setError("");
    setUploadProgress(0);
    setAudioPreviewUrl(null);
    setAudioDuration(null);
    setIsPlaying(false);
    setIsDirty(false);
  }, [audioPreviewUrl, initialFormState]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccessModal(false);
    handleReset();
  }, [handleReset]);

  const handleAlbumCreated = useCallback(
    (album: any) => {
      if (uploadForm.audioFile) {
        setUploadForm((prev) => ({
          ...prev,
          albumId: album.id,
          albumName: album.title,
        }));
      }
      setIsAlbumModalOpen(false);
    },
    [uploadForm.audioFile]
  );

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  return (
    <>
      <Helmet>
        <title>Artist Dashboard - Add Content</title>
      </Helmet>

      <div className={styles.uploadLayout}>
        <div className={styles.actionsContainer}>
          <button
            className={styles.createAlbumButton}
            onClick={() => setIsAlbumModalOpen(true)}
          >
            <LuPlus /> Create Album
          </button>
        </div>

        {!uploadForm.audioFile ? (
          <div
            className={`${styles.dropzone} ${
              dragOver ? styles.dropzoneHover : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={onChooseFile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") onChooseFile();
            }}
          >
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/mpeg,.mp3"
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />

            <div className={styles.dropzoneIcon}>
              <LuFileUp />
            </div>

            <div className={styles.dropzoneText}>
              Drag and drop an audio file here to upload
              {error ? (
                <span className={styles.errorText}>{error}</span>
              ) : (
                <span className={styles.dropzoneHint}>
                  .mp3 files smaller than 10 MB are accepted
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.uploadCard}>
            <div className={styles.audioInfoContainer}>
              <div className={styles.audioFileInfo}>
                <div className={styles.audioFileDetails}>
                  <span className={styles.audioFileName}>
                    {uploadForm.audioFile.name}
                  </span>
                  <span className={styles.audioFileMeta}>
                    {formatFileSize(uploadForm.audioFile.size)} MB &bull;{" "}
                    {formatDuration(audioDuration)}
                  </span>
                </div>
                {audioPreviewUrl && (
                  <button
                    type="button"
                    className={styles.playButton}
                    onClick={togglePlayPause}
                  >
                    {!isPlaying ? <LuCirclePlay /> : <LuCirclePause />}
                  </button>
                )}
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            <audio
              ref={audioRef}
              src={audioPreviewUrl || undefined}
              onEnded={() => setIsPlaying(false)}
              style={{ display: "none" }}
            />

            <form className={styles.uploadForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formLeft}>
                  <SettingsInput
                    label="Song Title"
                    name="title"
                    value={uploadForm.title}
                    onChange={handleFormChange}
                    placeholder="Enter song title"
                    disabled={isUploading}
                    required={true}
                  />

                  <SettingsInput
                    label="Genre"
                    name="genre"
                    value={uploadForm.genre}
                    onChange={handleFormChange}
                    placeholder="Pop, Hip-Hop, Rock..."
                    disabled={isUploading}
                    required={true}
                  />

                  <SettingsDatePicker
                    label="Release Date"
                    name="releaseDate"
                    value={uploadForm.releaseDate}
                    onChange={handleDateChange}
                    disabled={isUploading}
                    max={new Date().toISOString().split("T")[0]}
                  />

                  <SettingsRadio
                    label="Visibility"
                    name="visibilityStatus"
                    value={uploadForm.visibilityStatus}
                    onChange={(value) =>
                      handleDropdownChange("visibilityStatus", value)
                    }
                    options={[
                      { label: "Public", value: "PUBLIC" },
                      { label: "Private", value: "PRIVATE" },
                      { label: "Unlisted", value: "UNLISTED" },
                    ]}
                    disabled={isUploading}
                  />
                </div>
                <div className={styles.formRight}>
                  <SearchableDropdown
                    label="Album"
                    name="albumId"
                    entityType="album"
                    onChange={(value) => handleDropdownChange("albumId", value)}
                    disabled={isUploading}
                    placeholder="Select an album..."
                    ownerId={user?.id}
                    hint="Add this song to an existing album (Optional)"
                    value={uploadForm.albumId}
                    displayValue={uploadForm.albumName}
                  />

                  <SearchableList
                    label="Featured Artists"
                    name="artists"
                    entityType="artist"
                    value={uploadForm.artists}
                    onChange={(artists) =>
                      setUploadForm((prev) => ({ ...prev, artists }))
                    }
                    disabled={isUploading}
                    placeholder="Search for artists..."
                    secondaryField={{
                      name: "role",
                      label: "Role",
                      placeholder: "e.g., Featured, Producer",
                    }}
                    hint="Add featured artists and specify their roles (Optional)"
                  />

                  <SettingsImageUpload
                    label="Cover Image"
                    onImageChange={handleCoverImageChange}
                    type="music"
                    disabled={isUploading}
                    alt="Song Cover Preview"
                    hint="Upload a cover image for your song (optional)"
                  />
                </div>
              </div>

              <div className={styles.buttonContainer}>
                {error && <span className={styles.errorText}>{error}</span>}
                <div className={styles.buttons}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleReset}
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.uploadButton}
                    disabled={isUploading || !isDirty}
                  >
                    {isUploading ? "Uploading..." : "Upload Song"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {uploadedSongId && (
        <UploadSuccessModal
          isOpen={showSuccessModal}
          onClose={handleSuccessClose}
          songTitle={uploadForm.title}
          songId={uploadedSongId}
        />
      )}

      {user && (
        <CreateAlbumModal
          mode="create"
          userId={user.id}
          artistId={user.artist_id!}
          isOpen={isAlbumModalOpen}
          onClose={() => setIsAlbumModalOpen(false)}
          onAlbumCreated={handleAlbumCreated}
        />
      )}
    </>
  );
};

export default memo(ArtistDashboardAddPage);
