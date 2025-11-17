import styles from "./InputGroup.module.css";
import classNames from "classnames";

export interface InputGroupProps {
  label: string;
  type: string;
  id: string;
  name?: string; // if different from id
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  hint?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({
  label,
  type,
  id,
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  hint,
}) => {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.formLabel}>
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        className={classNames(styles.input, {
          [styles.inputError]: !!error,
        })}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <span className={styles.inputErrorText}>{error}</span>}
      {hint && <span className={styles.inputHintText}>{hint}</span>}
    </div>
  );
};

export default InputGroup;
