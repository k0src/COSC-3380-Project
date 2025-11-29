import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  AdminDashboardStats,
  AdminDashboardUserGrowthChart,
  AdminDashboardPlatformActivityChart,
  AdminDashboardTopArtists,
  AdminDashboardPlatformHealth,
  DataTable,
} from "@components";
import { reportApi } from "@api";
import { reportsColumns } from "@components/DataTable/columnDefinitions/reportColumns.js";
import styles from "./AdminDashboard.module.css";
import { LuShield } from "react-icons/lu";

const AdminDashboard: React.FC = () => {
  const fetchReports = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return reportApi.getReports({ limit, offset });
    },
    []
  );

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - CoogMusic</title>
      </Helmet>

      <div className={styles.adLayout}>
        <header className={styles.adHeader}>
          <div className={styles.adHeaderLeft}>
            <LuShield className={styles.adHeaderIcon} />
            <span className={styles.adTitle}>Admin Dashboard</span>
          </div>
          <Link className={styles.adHeaderButton} to="/admin/reports-appeals">
            View All Reports & Appeals
          </Link>
        </header>

        <AdminDashboardStats />

        <div className={styles.contentArea}>
          <div className={styles.chartsColumn}>
            <AdminDashboardUserGrowthChart />
            <AdminDashboardPlatformActivityChart />
          </div>
          <AdminDashboardTopArtists />
        </div>

        <div className={styles.contentArea}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Recent Reports</span>
              <Link to="/admin/reports-appeals" className={styles.viewMoreLink}>
                View All
              </Link>
            </div>
            <DataTable
              fetchData={fetchReports}
              columns={reportsColumns}
              cacheKey="admin_recent_reports"
              dependencies={[]}
              initialRowsPerPage={10}
              rowsPerPageOptions={[]}
            />
          </div>
          <AdminDashboardPlatformHealth />
        </div>
      </div>
    </>
  );
};

export default memo(AdminDashboard);
