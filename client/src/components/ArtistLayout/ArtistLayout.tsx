import { memo } from "react";
import { useAuth } from "@contexts";
import { ArtistLayoutSidebar, MainLayoutHeader } from "@components";
import styles from "./ArtistLayout.module.css";

const ArtistLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className={styles.layoutContainer}>
      <ArtistLayoutSidebar />
      <div className={styles.mainContent}>
        <MainLayoutHeader />
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
};

export default memo(ArtistLayout);
