import { memo } from "react";
import styles from "./SettingsInput.module.css";
import classNames from "classnames";

export interface SettingsInputProps {
  label: string;
  hint?: string;
  type?: string;
  error?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const SettingsInput: React.FC<SettingsInputProps> = ({
  label,
  hint,
  error = false,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  disabled,
  required = false,
}) => {
  return (
    <div className={styles.settingsInputGroup}>
      <label className={styles.label}>
        {label} {required && <span className={styles.red}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={classNames(styles.settingsInput, {
          [styles.settingsInputDisabled]: disabled,
          [styles.settingsInputError]: !!error,
        })}
        required={required}
      />
      {error && <span className={styles.settingsInputErrorText}>{error}</span>}
      {hint && !error && (
        <span className={styles.settingsInputHint}>{hint}</span>
      )}
    </div>
  );
};

export default memo(SettingsInput);
