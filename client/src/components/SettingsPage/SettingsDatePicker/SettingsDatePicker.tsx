import { memo } from "react";
import styles from "./SettingsDatePicker.module.css";
import classNames from "classnames";

export interface SettingsDatePickerProps {
  label: string;
  hint?: string;
  error?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  required?: boolean;
}

const SettingsDatePicker: React.FC<SettingsDatePickerProps> = ({
  label,
  hint,
  error = false,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  min,
  max,
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.settingsDatePickerGroup}>
      <label className={styles.settingsDatePickerLabel}>
        {label} {required && <span className={styles.red}>*</span>}
      </label>
      <input
        type="date"
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        className={classNames(styles.settingsDatePicker, {
          [styles.settingsDatePickerDisabled]: disabled,
          [styles.settingsDatePickerError]: !!error,
        })}
        required={required}
      />
      {error && (
        <span className={styles.settingsDatePickerErrorText}>{error}</span>
      )}
      {hint && !error && (
        <span className={styles.settingsDatePickerHint}>{hint}</span>
      )}
    </div>
  );
};

export default memo(SettingsDatePicker);
