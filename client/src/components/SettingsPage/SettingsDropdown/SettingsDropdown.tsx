import { memo } from "react";
import styles from "./SettingsDropdown.module.css";
import classNames from "classnames";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface SettingsDropdownProps {
  label: string;
  hint?: string;
  error?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  label,
  hint,
  error = false,
  name,
  options,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.settingsDropdownGroup}>
      <label className={styles.settingsDropdownLabel}>{label}</label>
      <select
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={classNames(styles.select, {
          [styles.selectError]: !!error,
        })}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className={styles.settingsDropdownErrorText}>{error}</span>
      )}
      {hint && !error && (
        <span className={styles.settingsDropdownHint}>{hint}</span>
      )}
    </div>
  );
};

export default memo(SettingsDropdown);
