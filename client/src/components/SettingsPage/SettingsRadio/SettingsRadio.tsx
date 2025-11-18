import { memo } from "react";
import styles from "./SettingsRadio.module.css";
import classNames from "classnames";

export interface RadioOption {
  value: string;
  label: string;
}

export interface SettingsRadioProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  hint?: string;
  orientation?: "horizontal" | "vertical";
  required?: boolean;
}

const SettingsRadio: React.FC<SettingsRadioProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  disabled,
  hint,
  orientation = "horizontal",
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.settingsRadioGroup}>
      <label className={styles.settingsRadioLabel}>
        {label} {required && <span className={styles.red}>*</span>}
      </label>
      <div
        className={classNames(styles.radioOptions, {
          [styles.horizontal]: orientation === "horizontal",
          [styles.vertical]: orientation === "vertical",
        })}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={classNames(styles.radioOption, {
              [styles.radioOptionDisabled]: disabled,
              [styles.radioOptionChecked]: value === option.value,
            })}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              disabled={disabled}
              className={styles.radioInput}
              required={required}
            />
            <span className={styles.radioCustom} />
            <span className={styles.radioLabel}>{option.label}</span>
          </label>
        ))}
      </div>
      {hint && <span className={styles.settingsRadioHint}>{hint}</span>}
    </div>
  );
};

export default memo(SettingsRadio);
