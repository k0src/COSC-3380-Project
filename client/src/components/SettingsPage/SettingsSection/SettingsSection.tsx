import { memo } from "react";
import styles from "./SettingsSection.module.css";
import classNames from "classnames";

export interface SettingsSectionProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showDivider?: boolean;
  danger?: boolean;
  hasForm?: boolean;
  onSave?: () => Promise<void>;
  isDirty?: boolean;
  isSaving?: boolean;
  saveError?: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  children,
  title,
  description,
  showDivider = true,
  danger = false,
  hasForm = true,
  onSave,
  isDirty = false,
  isSaving = false,
  saveError,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave && !isSaving) {
      await onSave();
    }
  };

  return (
    <form className={styles.settingsSection} onSubmit={handleSubmit}>
      <div className={styles.settingsContent}>
        <div className={styles.settingsTitleContainer}>
          <span
            className={classNames(styles.settingsTitle, {
              [styles.settingsTitleDanger]: danger,
            })}
          >
            {title}
          </span>
          {description && (
            <span className={styles.settingsDescription}>{description}</span>
          )}
        </div>
        <div className={styles.settings}>
          {children}
          {hasForm && (
            <div className={styles.settingsButtonContainer}>
              {isDirty && (
                <span className={styles.unsavedText}>
                  You have unsaved changes.
                </span>
              )}
              {saveError && (
                <span className={styles.unsavedText}>{saveError}</span>
              )}
              <button
                type="submit"
                className={styles.saveButton}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
      {showDivider && <div className={styles.settingsDivider}></div>}
    </form>
  );
};

export default memo(SettingsSection);
