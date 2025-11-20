import { memo } from "react";
import { ArtistLayoutSidebar, MainLayoutHeader } from "@components";
import styles from "./ArtistDashboardLayout.module.css";

export interface ArtistDashboardLayoutProps {
  artistName: string;
  artistImageUrl: string;
  children?: React.ReactNode;
}

const ArtistDashboardLayout: React.FC<ArtistDashboardLayoutProps> = ({
  artistName,
  artistImageUrl,
  children,
}) => (
  <div className={styles.layoutContainer}>
    <ArtistLayoutSidebar
      artistName={artistName}
      artistImageUrl={artistImageUrl}
    />
    <div className={styles.mainContent}>
      <MainLayoutHeader />
      <main className={styles.contentArea}>{children}</main>
    </div>
  </div>
);

export default memo(ArtistDashboardLayout);
