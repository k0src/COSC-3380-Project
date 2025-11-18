import { memo, useMemo } from "react";
import styles from "./SettingsColorSchemeSelector.module.css";
import classNames from "classnames";
import DarkSchemeButton from "@assets/cs-dark-button.svg?react";
import LightSchemeButton from "@assets/cs-light-button.svg?react";

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

  const systemButton = useMemo(() => {
    return systemPreference === "dark" ? (
      <DarkSchemeButton className={styles.colorSchemeImage} />
    ) : (
      <LightSchemeButton className={styles.colorSchemeImage} />
    );
  }, [systemPreference]);

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
          {systemButton}
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
          <LightSchemeButton className={styles.colorSchemeImage} />
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
          <DarkSchemeButton className={styles.colorSchemeImage} />
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
