import { memo, useCallback } from "react";
import styles from "./SettingsCheckbox.module.css";
import classNames from "classnames";

export interface SettingsCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  name: string;
  disabled?: boolean;
  required?: boolean;
}

const SettingsCheckbox: React.FC<SettingsCheckboxProps> = ({
  label,
  checked,
  onChange,
  error = false,
  name,
  disabled,
  required = false,
}) => {
  const handleToggle = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, disabled, onChange]);

  return (
    <div className={styles.settingsCheckbox}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={handleToggle}
        disabled={disabled}
        className={classNames(styles.checkbox, {
          [styles.checkboxDisabled]: disabled,
          [styles.checkboxError]: !!error,
        })}
        required={required}
      />
      <label className={styles.label}>
        {label} {required && <span className={styles.red}>*</span>}
      </label>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default memo(SettingsCheckbox);
