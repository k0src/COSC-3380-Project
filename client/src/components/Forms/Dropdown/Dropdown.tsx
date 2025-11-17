import { memo } from "react";
import styles from "./Dropdown.module.css";
import classNames from "classnames";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
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

const Dropdown: React.FC<DropdownProps> = ({
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
    <div className={styles.dropdownGroup}>
      <label className={styles.dropdownLabel}>{label}</label>
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
      {error && <span className={styles.dropdownErrorText}>{error}</span>}
      {hint && !error && <span className={styles.dropdownHint}>{hint}</span>}
    </div>
  );
};

export default memo(Dropdown);
