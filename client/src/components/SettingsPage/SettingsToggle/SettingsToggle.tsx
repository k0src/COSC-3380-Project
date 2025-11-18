import { memo, useState, useCallback, useRef, useEffect } from "react";
import styles from "./SettingsToggle.module.css";
import classNames from "classnames";

export interface SettingsToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  name: string;
  disabled?: boolean;
  values?: {
    on: string;
    off: string;
  };
  required?: boolean;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  hint,
  checked,
  onChange,
  error = false,
  name,
  disabled,
  values = { on: "On", off: "Off" },
  required = false,
}) => {
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [hintTimeoutId, setHintTimeoutId] = useState<NodeJS.Timeout | null>(
    null
  );
  const [shouldWrap, setShouldWrap] = useState(false);
  const [hintWidth, setHintWidth] = useState<number | undefined>(undefined);
  const hintRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, disabled, onChange]);

  useEffect(() => {
    if (isHintVisible && hintRef.current) {
      const hintRect = hintRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportRightEdge = viewportWidth;
      const viewportLeftEdge = 0;
      const currentWidth = hintRect.width;
      const hintRight = hintRect.right;
      const hintLeft = hintRect.left;

      const overflowRight = Math.max(0, hintRight - viewportRightEdge);
      const overflowLeft = Math.max(0, viewportLeftEdge - hintLeft);
      const totalOverflow = overflowRight + overflowLeft;

      if (totalOverflow > 0) {
        const newWidth = currentWidth - totalOverflow - 100;
        setShouldWrap(true);
        setHintWidth(newWidth);
      } else {
        setShouldWrap(false);
        setHintWidth(undefined);
      }
    } else if (!isHintVisible) {
      setShouldWrap(false);
      setHintWidth(undefined);
    }
  }, [isHintVisible]);

  const handleHintVisibility = useCallback(() => {
    if (hint) {
      const timeoutId = setTimeout(() => {
        setIsHintVisible(true);
      }, 1000);
      setHintTimeoutId(timeoutId);
    }
  }, [hint]);

  const handleHintHide = useCallback(() => {
    if (hintTimeoutId) {
      clearTimeout(hintTimeoutId);
      setHintTimeoutId(null);
    }
    setIsHintVisible(false);
    setShouldWrap(false);
    setHintWidth(undefined);
  }, [hintTimeoutId]);

  return (
    <div className={styles.settingsToggleGroup}>
      <label className={styles.settingsToggleLabel}>
        {label} {required && <span className={styles.red}>*</span>}
      </label>
      <div
        className={styles.toggleContainer}
        onMouseEnter={handleHintVisibility}
        onMouseLeave={handleHintHide}
      >
        <button
          type="button"
          role="switch"
          name={name}
          onClick={handleToggle}
          disabled={disabled}
          className={classNames(styles.toggle, {
            [styles.toggleOn]: checked,
            [styles.toggleDisabled]: disabled,
          })}
        >
          <span
            className={classNames(styles.toggleSlider, {
              [styles.toggleSliderOn]: checked,
            })}
          />
        </button>
        <span className={styles.toggleLabel}>
          {checked ? values.on : values.off}
        </span>
        {hint && isHintVisible && (
          <div
            ref={hintRef}
            className={classNames(styles.hint, {
              [styles.hintWrap]: shouldWrap,
              [styles.hintVisible]: isHintVisible,
            })}
            style={hintWidth ? { width: `${hintWidth}px` } : undefined}
          >
            {hint}
          </div>
        )}
      </div>
      {error && <span className={styles.settingsToggleErrorText}>{error}</span>}
    </div>
  );
};

export default memo(SettingsToggle);
