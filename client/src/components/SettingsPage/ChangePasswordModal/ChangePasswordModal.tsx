import { useState, memo, useEffect } from "react";
import { LuX, LuEye, LuEyeOff } from "react-icons/lu";
import { userApi } from "@api";
import authApi from "@api/auth.api";
import { validatePassword, validateConfirmPassword } from "@validators";
import styles from "./ChangePasswordModal.module.css";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onPasswordChanged?: () => void;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordVisibility {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userId,
  onPasswordChanged,
}) => {
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visibility, setVisibility] = useState<PasswordVisibility>({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});
  const [apiError, setApiError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
      setApiError("");
      setSuccess(false);
      setVisibility({ current: false, new: false, confirm: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof PasswordFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError("");
    }
  };

  const toggleVisibility = (field: keyof PasswordVisibility) => {
    setVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordFormData> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    const newPasswordError = validatePassword(formData.newPassword);
    if (newPasswordError) {
      newErrors.newPassword = newPasswordError;
    }

    const confirmPasswordError = validateConfirmPassword(
      formData.newPassword,
      formData.confirmPassword
    );
    if (confirmPasswordError) {
      newErrors.confirmPassword = confirmPasswordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      await userApi.update(userId, {
        new_password: formData.newPassword,
        current_password: formData.currentPassword,
      });

      try {
        await authApi.getCurrentUser();
        onPasswordChanged?.();
      } catch (refreshError) {
        console.warn(
          "Failed to refresh user data after password change:",
          refreshError
        );
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("Error changing password:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to change password";
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Change Password</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <LuX />
          </button>
        </div>

        {apiError && (
          <div className={styles.errorBanner}>
            <span>{apiError}</span>
          </div>
        )}
        {success && (
          <div className={styles.successBanner}>
            <span>Password changed successfully!</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Current Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={visibility.current ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={styles.input}
                disabled={isSubmitting || success}
              />
              <button
                type="button"
                className={styles.visibilityButton}
                onClick={() => toggleVisibility("current")}
                disabled={isSubmitting || success}
              >
                {visibility.current ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {errors.currentPassword && (
              <span className={styles.error}>{errors.currentPassword}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>New Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={visibility.new ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={styles.input}
                disabled={isSubmitting || success}
              />
              <button
                type="button"
                className={styles.visibilityButton}
                onClick={() => toggleVisibility("new")}
                disabled={isSubmitting || success}
              >
                {visibility.new ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {errors.newPassword && (
              <span className={styles.error}>{errors.newPassword}</span>
            )}
            <span className={styles.hint}>
              8+ characters with uppercase, lowercase, number, and special
              character (@$!%*?&)
            </span>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Confirm New Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={visibility.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={styles.input}
                disabled={isSubmitting || success}
              />
              <button
                type="button"
                className={styles.visibilityButton}
                onClick={() => toggleVisibility("confirm")}
                disabled={isSubmitting || success}
              >
                {visibility.confirm ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className={styles.error}>{errors.confirmPassword}</span>
            )}
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting || success}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || success}
            >
              {isSubmitting ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(ChangePasswordModal);
