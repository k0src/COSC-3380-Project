import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Admin.module.css";

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.adminContainer}>
      <div className={styles.pageContent}>
        <div className={styles.dashboard}>
          <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
          <p className={styles.dashboardSubtitle}>Select a section to manage</p>
          
          <div className={styles.dashboardCards}>
            <div 
              className={styles.dashboardCard}
              onClick={() => navigate("/admin/reports")}
            >
              <div className={styles.cardIcon}>📋</div>
              <h3 className={styles.cardTitle}>User Reports</h3>
              <p className={styles.cardDescription}>
                Manage content moderation and user-generated reports
              </p>
              <div className={styles.cardArrow}>→</div>
            </div>

            <div 
              className={styles.dashboardCard}
              onClick={() => navigate("/admin/data-reports")}
            >
              <div className={styles.cardIcon}>📊</div>
              <h3 className={styles.cardTitle}>Data Reports</h3>
              <p className={styles.cardDescription}>
                View analytics, active users, and content insights
              </p>
              <div className={styles.cardArrow}>→</div>
            </div>

            {/* <div 
              className={styles.dashboardCard}
              onClick={() => navigate("/admin/appeals")}
            >
              <div className={styles.cardIcon}>⚖️</div>
              <h3 className={styles.cardTitle}>Appeals Management</h3>
              <p className={styles.cardDescription}>
                Review and decide on user appeals for content and accounts
              </p>
              <div className={styles.cardArrow}>→</div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;