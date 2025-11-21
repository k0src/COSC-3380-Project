import { memo, useState, useRef, useEffect } from "react";
import classNames from "classnames";
import type { TableDropdownOption } from "@types";
import styles from "./TableDropdown.module.css";

interface TableDropdownProps {
  options: TableDropdownOption[];
  trigger: React.ReactNode;
  align?: "left" | "right";
  disabled?: boolean;
}

const TableDropdown: React.FC<TableDropdownProps> = ({
  options,
  trigger,
  align = "left",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionClick = (option: TableDropdownOption) => {
    option.onClick();
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button
        className={styles.dropdownTrigger}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={classNames(styles.dropdownMenu, {
            [styles.dropdownMenuRight]: align === "right",
          })}
        >
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                className={classNames(styles.dropdownOption, {
                  [styles.dropdownOptionDanger]: option.variant === "danger",
                })}
                onClick={() => handleOptionClick(option)}
              >
                {Icon && <Icon className={styles.dropdownOptionIcon} />}
                <span className={styles.dropdownLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(TableDropdown);
