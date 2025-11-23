import { useState, memo, useEffect, useCallback, useMemo } from "react";
import type { UserRole } from "@types";
import { userApi } from "@api";
import {
  SettingsInput,
  SettingsDropdown,
  SettingsImageUpload,
} from "@components";
import styles from "./CreateUserModal.module.css";
import { LuX } from "react-icons/lu";

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  profile_picture_url?: File | null;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const initialFormState: CreateUserForm = useMemo(() => {
    return {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "USER",
      profile_picture_url: null,
    };
  }, []);

  const [formState, setFormState] = useState<CreateUserForm>(
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
      formState.password !== initialFormState.password ||
      formState.confirmPassword !== initialFormState.confirmPassword ||
      formState.role !== initialFormState.role ||
      formState.profile_picture_url !== initialFormState.profile_picture_url;
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

  const handleImageChange = useCallback(
    (file: File | null) => {
      setFormState((prev) => ({
        ...prev,
        profile_picture_url: file,
      }));
      if (error) {
        setError("");
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

      if (!formState.password.trim()) {
        setError("Password cannot be empty");
        return;
      }

      if (formState.password !== formState.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (formState.password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }

      setIsCreating(true);
      setError("");

      try {
        const userData: any = {
          username: formState.username.trim(),
          email: formState.email.trim(),
          password: formState.password,
          role: formState.role,
        };

        if (formState.profile_picture_url) {
          userData.profile_picture_url = formState.profile_picture_url;
        }

        await userApi.create(userData);

        onUserCreated?.();
        onClose();
      } catch (error: any) {
        console.error("Error creating user:", error);
        const errorMessage =
          error.response?.data?.error || "Failed to create user";
        setError(errorMessage);
      } finally {
        setIsCreating(false);
      }
    },
    [formState, onClose, onUserCreated]
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
          <span className={styles.title}>Create User</span>
          <button className={styles.headerButton} onClick={onClose}>
            <LuX />
          </button>
        </div>
        <form className={styles.userForm} onSubmit={handleSubmit}>
          <SettingsInput
            label="Username"
            name="username"
            value={formState.username}
            onChange={handleFormChange}
            placeholder="johndoe"
            error={error}
            disabled={isCreating}
            required
          />
          <SettingsInput
            label="Email"
            name="email"
            value={formState.email}
            onChange={handleFormChange}
            placeholder="user@example.com"
            error={error}
            disabled={isCreating}
            required
          />
          <SettingsInput
            label="Password"
            name="password"
            type="password"
            value={formState.password}
            onChange={handleFormChange}
            error={error}
            disabled={isCreating}
            required
            hint="Password must be at least 8 characters long"
          />
          <SettingsInput
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formState.confirmPassword}
            onChange={handleFormChange}
            error={error}
            disabled={isCreating}
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
            disabled={isCreating}
            hint="Select the user's role in the system"
          />
          <SettingsImageUpload
            label="Profile Picture"
            currentImage={undefined}
            onImageChange={handleImageChange}
            type="user"
            disabled={isCreating}
            alt="Profile Picture Preview"
            hint="Upload a profile picture for this user (optional)."
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
                disabled={isCreating || !isDirty}
              >
                {isCreating ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(CreateUserModal);
