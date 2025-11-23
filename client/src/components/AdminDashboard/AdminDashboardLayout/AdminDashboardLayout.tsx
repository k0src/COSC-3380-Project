import { memo } from "react";
import { MainLayoutHeader, AdminDashboardLayoutSidebar } from "@components";
import styles from "./AdminDashboardLayout.module.css";

const AdminDashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className={styles.layoutContainer}>
      <AdminDashboardLayoutSidebar />
      <div className={styles.mainContent}>
        <MainLayoutHeader />
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
};

export default memo(AdminDashboardLayout);
