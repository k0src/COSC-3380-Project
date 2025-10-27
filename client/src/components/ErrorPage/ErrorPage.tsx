import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { LuBan } from "react-icons/lu";
import styles from "./ErrorPage.module.css";

type ErrorPageProps = {
  title?: string;
  message?: string;
};

const ErrorPage: React.FC<ErrorPageProps> = ({ title, message }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className={styles.errorPageContainer}>
      <LuBan className={styles.errorIcon} />
      <h1 className={styles.errorTitle}>{title || "An Error Occurred"}</h1>
      <span className={styles.errorMessage}>
        {message || "Sorry, something went wrong. Please try again later."}
      </span>
      <button className={styles.homeButton} onClick={handleGoHome}>
        Go Home
      </button>
    </div>
  );
};

export default memo(ErrorPage);
