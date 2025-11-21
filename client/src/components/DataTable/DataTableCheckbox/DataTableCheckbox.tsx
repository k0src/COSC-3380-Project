import { memo } from "react";
import styles from "./DataTableCheckbox.module.css";

interface DataTableCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const DataTableCheckbox: React.FC<DataTableCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className={styles.checkboxWrapper}>
      <input
        type="checkbox"
        className={styles.customCheckbox}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};

export default memo(DataTableCheckbox);
