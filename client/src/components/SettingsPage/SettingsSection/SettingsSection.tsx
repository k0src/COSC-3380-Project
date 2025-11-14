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
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  children,
  title,
  description,
  showDivider = true,
  danger = false,
  hasForm = true,
}) => {
  return (
    <form className={styles.settingsSection}>
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
          <div className={styles.settingsButtonContainer}>
            {/* <span className={styles.unsavedText}>
              You have unsaved changes.
            </span> */}
            {/* render conditionally */}
            {hasForm && (
              <button className={styles.saveButton}>Save Changes</button>
            )}
          </div>
        </div>
      </div>
      {showDivider && <div className={styles.settingsDivider}></div>}
    </form>
  );
};

export default memo(SettingsSection);
