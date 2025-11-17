import { memo } from "react";
import styles from "./SettingsTextArea.module.css";
import classNames from "classnames";

export interface SettingsTextAreaProps {
  label: string;
  hint?: string;
  error?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: "small" | "medium" | "large";
}

const SettingsTextArea: React.FC<SettingsTextAreaProps> = ({
  label,
  hint,
  error = false,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  height = "small",
}) => {
  return (
    <div className={styles.settingsTextAreaGroup}>
      <label className={styles.settingsTextAreaLabel}>{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={classNames(styles.settingsTextArea, {
          [styles.settingsTextAreaDisabled]: disabled,
          [styles.settingsTextAreaError]: !!error,
          [styles.settingsTextAreaHeightSmall]: height === "small",
          [styles.settingsTextAreaHeightMedium]: height === "medium",
          [styles.settingsTextAreaHeightLarge]: height === "large",
        })}
      />
      {error && (
        <span className={styles.settingsTextAreaErrorText}>{error}</span>
      )}
      {hint && !error && (
        <span className={styles.settingsTextAreaHint}>{hint}</span>
      )}
    </div>
  );
};

export default memo(SettingsTextArea);
