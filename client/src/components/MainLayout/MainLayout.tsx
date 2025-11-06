import styles from "./MainLayout.module.css";
import {
  MainLayoutHeader,
  MainLayoutNowPlayingBar,
  MainLayoutSidebar,
} from "@components";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className={styles.layoutContainer}>
      <MainLayoutSidebar />
      <div className={styles.mainContent}>
        <MainLayoutHeader />
        <main className={styles.contentArea}>{children}</main>
      </div>
      <MainLayoutNowPlayingBar />
    </div>
  );
};

export default MainLayout;
