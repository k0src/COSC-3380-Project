import { useState, useEffect, memo } from "react";
import { LuX } from "react-icons/lu";
import styles from "./DevBanner.module.css";

const DevBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [buildVersion, setBuildVersion] = useState<string>("v2.41");

  useEffect(() => {
    const isDismissed = localStorage.getItem("dev-banner-dismissed");
    if (isDismissed) return;

    if (import.meta.env.DEV) {
      setIsVisible(true);
    } else {
      fetch("/build-info.json")
        .then((res) => res.json())
        .then((data) => {
          if (data.version) {
            setBuildVersion(data.version);
            setIsVisible(true);
          }
        })
        .catch(() => {
          setIsVisible(true);
        });
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("dev-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className={styles.banner}>
      <span className={styles.text}>Development Build: {buildVersion}</span>
      <button onClick={handleClose} className={styles.closeButton}>
        <LuX />
      </button>
    </div>
  );
};

export default memo(DevBanner);
