import { memo } from "react";
import { Helmet } from "react-helmet-async";
import { LuCircleAlert, LuRefreshCw, LuHouse } from "react-icons/lu";
import styles from "./ErrorFallback.module.css";

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  onReset,
}) => {
  const isDev = import.meta.env.DEV;

  const handleGoHome = () => {
    onReset();
    window.location.href = "/";
  };

  const handleReload = () => {
    onReset();
    window.location.reload();
  };

  return (
    <>
      <Helmet>
        <title>Something Went Wrong</title>
      </Helmet>
      <div className={styles.errorFallbackContainer}>
        <div className={styles.errorContent}>
          <header className={styles.errorHeader}>
            <LuCircleAlert className={styles.errorIcon} />
            <h1 className={styles.errorTitle}>Oops! Something went wrong</h1>
            <span className={styles.errorMessage}>
              An unexpected error occurred. Please try refreshing the page or
              returning home.
            </span>

            <div className={styles.buttonGroup}>
              <button className={styles.reloadButton} onClick={handleReload}>
                <LuRefreshCw />
                Reload Page
              </button>
              <button className={styles.homeButton} onClick={handleGoHome}>
                <LuHouse />
                Go Home
              </button>
            </div>
          </header>

          {isDev && error && (
            <div className={styles.errorDetails}>
              <h2 className={styles.errorDetailsTitle}>Error Details</h2>
              <div className={styles.errorLog}>
                <div className={styles.errorLogSection}>
                  <strong>Error:</strong>
                  <pre className={styles.errorLogContent}>
                    {error.toString()}
                  </pre>
                </div>
                {error.stack && (
                  <div className={styles.errorLogSection}>
                    <strong>Stack Trace:</strong>
                    <pre className={styles.errorLogContent}>{error.stack}</pre>
                  </div>
                )}
                {errorInfo && errorInfo.componentStack && (
                  <div className={styles.errorLogSection}>
                    <strong>Component Stack:</strong>
                    <pre className={styles.errorLogContent}>
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(ErrorFallback);
