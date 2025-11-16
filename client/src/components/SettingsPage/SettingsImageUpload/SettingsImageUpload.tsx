import { memo, useRef, useState } from "react";
import styles from "./SettingsImageUpload.module.css";
import { LuTrash } from "react-icons/lu";
import userPlaceholder from "@assets/user-placeholder.webp";
import musicPlaceholder from "@assets/music-placeholder.webp";
import artistPlaceholder from "@assets/artist-placeholder.webp";

type ImageUploadType = "user" | "music" | "artist";

interface SettingsImageUploadProps {
  label: string;
  currentImage?: string;
  onImageChange: (file: File | null) => void;
  disabled?: boolean;
  hint?: string;
  type?: ImageUploadType;
}

const SettingsImageUpload: React.FC<SettingsImageUploadProps> = ({
  label,
  currentImage,
  onImageChange,
  disabled = false,
  hint,
  type = "user",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size must be less than 5MB.");
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageChange(file);
    }
  };

  const handleBrowseClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveImage = () => {
    if (!disabled) {
      setPreviewUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onImageChange(null);
    }
  };

  const displayImage = previewUrl !== null ? previewUrl : currentImage;

  return (
    <div className={styles.settingsImageUploadGroup}>
      <label className={styles.settingsImageUploadLabel}>{label}</label>

      <div className={styles.settingsImageUploadArea}>
        <img
          src={
            displayImage ||
            (type === "user"
              ? userPlaceholder
              : type === "music"
              ? musicPlaceholder
              : artistPlaceholder)
          }
          alt="Profile preview"
          className={styles.settingsImagePreview}
        />

        <button
          type="button"
          className={styles.settingsImageButton}
          onClick={handleBrowseClick}
          disabled={disabled}
        >
          Browse
        </button>

        {displayImage && (
          <button
            type="button"
            className={styles.settingsImageRemoveButton}
            onClick={handleRemoveImage}
            disabled={disabled}
          >
            <LuTrash />
          </button>
        )}
      </div>

      {hint && <div className={styles.settingsImageHint}>{hint}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
        disabled={disabled}
      />
    </div>
  );
};

export default memo(SettingsImageUpload);
