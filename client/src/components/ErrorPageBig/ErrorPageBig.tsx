import { memo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { LuBan } from "react-icons/lu";
import styles from "./ErrorPageBig.module.css";

type ErrorPageBigProps = {
  title?: string;
  message?: string;
};

const ErrorPageBig: React.FC<ErrorPageBigProps> = ({ title, message }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <>
      <Helmet>
        <title>Internal Server Error</title>
      </Helmet>
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
    </>
  );
};

export default memo(ErrorPageBig);
