import { memo, useMemo } from "react";
import styles from "./SettingsColorSchemeSelector.module.css";
import classNames from "classnames";
import lightButton from "@assets/theme-light-button.webp";
import darkButton from "@assets/theme-dark-button.webp";

export interface SettingsColorSchemeSelectorProps {
  label: string;
  value: "system" | "light" | "dark";
  onChange: (value: "system" | "light" | "dark") => void;
  error?: string;
  name: string;
  disabled?: boolean;
}

const SettingsColorSchemeSelector: React.FC<
  SettingsColorSchemeSelectorProps
> = ({ label, value, onChange, error, name, disabled }) => {
  const systemPreference = useMemo(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  const systemImage = systemPreference === "dark" ? darkButton : lightButton;

  const handleSelect = (scheme: "system" | "light" | "dark") => {
    if (!disabled) {
      onChange(scheme);
    }
  };

  return (
    <div className={styles.colorSchemeSelectorGroup}>
      <label className={styles.colorSchemeSelectorLabel}>{label}</label>
      <div className={styles.colorSchemeOptions}>
        <button
          type="button"
          onClick={() => handleSelect("system")}
          disabled={disabled}
          className={classNames(styles.colorSchemeButton, {
            [styles.colorSchemeButtonActive]: value === "system",
            [styles.colorSchemeButtonDisabled]: disabled,
          })}
        >
          <img
            src={systemImage}
            alt="System"
            className={styles.colorSchemeImage}
          />
          <span className={styles.colorSchemeLabel}>System</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect("light")}
          disabled={disabled}
          className={classNames(styles.colorSchemeButton, {
            [styles.colorSchemeButtonActive]: value === "light",
            [styles.colorSchemeButtonDisabled]: disabled,
          })}
        >
          <img
            src={lightButton}
            alt="Light"
            className={styles.colorSchemeImage}
          />
          <span className={styles.colorSchemeLabel}>Light</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect("dark")}
          disabled={disabled}
          className={classNames(styles.colorSchemeButton, {
            [styles.colorSchemeButtonActive]: value === "dark",
            [styles.colorSchemeButtonDisabled]: disabled,
          })}
        >
          <img
            src={darkButton}
            alt="Dark"
            className={styles.colorSchemeImage}
          />
          <span className={styles.colorSchemeLabel}>Dark</span>
        </button>
      </div>

      <input type="hidden" name={name} value={value} />

      {error && (
        <span className={styles.colorSchemeSelectorErrorText}>{error}</span>
      )}
    </div>
  );
};

export default memo(SettingsColorSchemeSelector);
