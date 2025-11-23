import { useState, memo, useEffect, useCallback, useMemo } from "react";
import type { UserStatus, UserRole, UserInfo } from "@types";
import { formatDateString, formatNumber, pluralize } from "@util";
import { adminApi } from "@api";
import {
  SettingsInput,
  SettingsDropdown,
  SettingsToggle,
  SettingsImageUpload,
} from "@components";
import styles from "./EditUserModal.module.css";
import {
  LuX,
  LuMusic,
  LuMessageSquare,
  LuHeart,
  LuUsers,
  LuUserPlus,
  LuListMusic,
} from "react-icons/lu";
import { Link } from "react-router-dom";

export interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserEdited?: () => void;
  user: UserInfo;
}

interface EditUserForm {
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  is_private: boolean;
  profile_picture_url?: File | null;
  removeImage?: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onUserEdited,
  user,
}) => {
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const initialFormState: EditUserForm = useMemo(() => {
    return {
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_private: user.is_private,
      profile_picture_url: null,
      removeImage: false,
    };
  }, [user]);

  const [formState, setFormState] = useState<EditUserForm>(
    () => initialFormState
  );

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormState(initialFormState);
  }, [initialFormState]);

  useEffect(() => {
    const isFormDirty =
      formState.username !== initialFormState.username ||
      formState.email !== initialFormState.email ||
      formState.role !== initialFormState.role ||
      formState.status !== initialFormState.status ||
      formState.is_private !== initialFormState.is_private ||
      formState.profile_picture_url !== initialFormState.profile_picture_url ||
      formState.removeImage === true;
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

  const handleDropdownChange = useCallback(
    (name: string, value: string) => {
      setFormState((prev) => ({ ...prev, [name]: value }));
      if (error) setError("");
    },
    [error]
  );

  const handlePrivacyChange = useCallback(
    (checked: boolean) => {
      setFormState((prev) => ({
        ...prev,
        is_private: checked,
      }));
      if (error) setError("");
    },
    [error]
  );

  const handleImageChange = useCallback(
    (file: File | null) => {
      if (file === null) {
        setFormState((prev) => ({
          ...prev,
          profile_picture_url: null,
          removeImage: true,
        }));
      } else {
        setFormState((prev) => ({
          ...prev,
          profile_picture_url: file,
          removeImage: false,
        }));
        if (error) {
          setError("");
        }
      }
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formState.username.trim()) {
        setError("Username cannot be empty");
        return;
      }

      if (!formState.email.trim()) {
        setError("Email cannot be empty");
        return;
      }

      setIsEditing(true);
      setError("");

      try {
        const updates: any = {
          username: formState.username.trim(),
          email: formState.email.trim(),
          role: formState.role,
          status: formState.status,
          is_private: formState.is_private,
        };

        if (formState.removeImage) {
          updates.profile_picture_url = null;
        } else if (formState.profile_picture_url) {
          updates.profile_picture_url = formState.profile_picture_url;
        }

        await adminApi.update(user.id, updates);

        onUserEdited?.();
        onClose();
      } catch (error: any) {
        console.error("Error editing user:", error);
        const errorMessage =
          error.response?.data?.error || "Failed to edit user";
        setError(errorMessage);
      } finally {
        setIsEditing(false);
      }
    },
    [formState, onClose, onUserEdited, user.id]
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
  }, [isOpen, initialFormState]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>{`Edit ${user.username}`}</span>
          <button className={styles.headerButton} onClick={onClose}>
            <LuX />
          </button>
        </div>

        <form className={styles.userForm} onSubmit={handleSubmit}>
          <div className={styles.userFormColumns}>
            <div className={styles.userFormColumn}>
              <SettingsInput
                label="Username"
                name="username"
                value={formState.username}
                onChange={handleFormChange}
                placeholder="Username"
                error={error}
                disabled={isEditing}
              />
              <SettingsInput
                label="Email"
                name="email"
                value={formState.email}
                onChange={handleFormChange}
                placeholder="email@example.com"
                error={error}
                disabled={isEditing}
                required
              />
              <SettingsDropdown
                label="Role"
                name="role"
                value={formState.role}
                onChange={(value) => handleDropdownChange("role", value)}
                options={[
                  { label: "User", value: "USER" },
                  { label: "Artist", value: "ARTIST" },
                  { label: "Admin", value: "ADMIN" },
                ]}
                disabled={isEditing}
              />
              <SettingsDropdown
                label="Status"
                name="status"
                value={formState.status}
                onChange={(value) => handleDropdownChange("status", value)}
                options={[
                  { label: "Active", value: "ACTIVE" },
                  { label: "Suspended", value: "SUSPENDED" },
                  { label: "Deactivated", value: "DEACTIVATED" },
                ]}
                disabled={isEditing}
              />
            </div>
            <div className={styles.userFormColumn}>
              <SettingsToggle
                label="Private Account"
                name="is_private"
                checked={formState.is_private}
                onChange={handlePrivacyChange}
                disabled={isEditing}
                values={{ on: "Private", off: "Public" }}
              />
              <SettingsImageUpload
                label="Profile Picture"
                currentImage={user.profile_picture_url || undefined}
                onImageChange={handleImageChange}
                type="user"
                disabled={isEditing}
                alt="Profile Picture Preview"
                hint="Upload a profile picture for this user (optional)."
              />
            </div>
          </div>
          <div className={styles.buttonContainer}>
            {isDirty && !error && (
              <span className={styles.unsavedText}>
                You have unsaved changes.
              </span>
            )}
            {error && <span className={styles.unsavedText}>{error}</span>}
            <div className={styles.buttons}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={isEditing || !isDirty}
              >
                {isEditing ? "Updating..." : "Update User"}
              </button>
            </div>
          </div>
        </form>

        <div className={styles.userForm}>
          <div className={styles.infoSection}>
            <span className={styles.sectionTitle}>User Information</span>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>User ID:</span>
                <span className={styles.infoValue}>{user.id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Joined:</span>
                <span className={styles.infoValue}>
                  {formatDateString(user.created_at)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Auth Method:</span>
                <span className={styles.infoValue}>
                  {user.authenticated_with}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Artist Profile:</span>
                {user.artist_id ? (
                  <Link
                    to={`/artists/${user.artist_id}`}
                    className={styles.artistLink}
                  >
                    View Artist Profile
                  </Link>
                ) : (
                  <span className={styles.infoValue}>—</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.infoSection}>
            <span className={styles.sectionTitle}>User Statistics</span>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <LuUsers className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>
                    {formatNumber(user.follower_count ?? 0)}
                  </span>
                  <span className={styles.statLabel}>
                    {pluralize(Number(user.follower_count ?? 0), "Follower")}
                  </span>
                </div>
              </div>
              <div className={styles.statCard}>
                <LuUserPlus className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>
                    {formatNumber(user.following_count ?? 0)}
                  </span>
                  <span className={styles.statLabel}>
                    {pluralize(Number(user.following_count ?? 0), "Following")}
                  </span>
                </div>
              </div>
              <div className={styles.statCard}>
                <LuHeart className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>
                    {formatNumber(user.likes_count ?? 0)}
                  </span>
                  <span className={styles.statLabel}>
                    {pluralize(Number(user.likes_count ?? 0), "Like")}
                  </span>
                </div>
              </div>
              <div className={styles.statCard}>
                <LuMessageSquare className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>
                    {formatNumber(user.comments_count ?? 0)}
                  </span>
                  <span className={styles.statLabel}>
                    {pluralize(Number(user.comments_count ?? 0), "comment")}
                  </span>
                </div>
              </div>
              <div className={styles.statCard}>
                <LuMusic className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>
                    {formatNumber(user.songs_count ?? 0)}
                  </span>
                  <span className={styles.statLabel}>
                    {pluralize(Number(user.songs_count ?? 0), "Song")}
                  </span>
                </div>
              </div>
              <div className={styles.statCard}>
                <LuListMusic className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>
                    {formatNumber(user.playlists_count ?? 0)}
                  </span>
                  <span className={styles.statLabel}>
                    {pluralize(Number(user.playlists_count ?? 0), "Playlist")}
                  </span>
                </div>
              </div>
              <div className={styles.statCard}>
                <LuListMusic className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>
                    {formatNumber(user.albums_count ?? 0)}
                  </span>
                  <span className={styles.statLabel}>
                    {pluralize(Number(user.albums_count ?? 0), "Album")}
                  </span>
                </div>
              </div>
              <div className={styles.statCard}>
                <LuListMusic className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>
                    {formatNumber(user.total_reports_count ?? 0)}
                  </span>
                  <span className={styles.statLabel}>
                    {pluralize(Number(user.total_reports_count ?? 0), "Report")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(EditUserModal);
