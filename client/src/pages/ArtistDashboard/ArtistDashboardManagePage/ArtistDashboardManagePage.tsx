import { memo } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@contexts";
import styles from "./ArtistDashboardManagePage.module.css";

const ArtistDashboardManagePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Manage Content - CoogMusic</title>
      </Helmet>

      <div className={styles.manageLayout}>
        <header className={styles.manageHeader}>
          <span className={styles.manageTitle}>Manage Content</span>
        </header>
      </div>
    </>
  );
};

export default memo(ArtistDashboardManagePage);
