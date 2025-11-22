import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Admin.module.css";

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  const dashboardItems = [
    {
      id: "reports",
      icon: "📋",
      title: "User Reports",
      description: "Manage content moderation and user-generated reports",
      route: "/admin/reports",
    },
    {
      id: "data-reports",
      icon: "📊",
      title: "Data Reports",
      description: "View analytics, active users, and content insights",
      route: "/admin/data-reports",
    },
    {
      id: "suspensions",
      icon: "🚫",
      title: "Suspension Manager",
      description: "Manage user and artist account suspensions",
      route: "/admin/suspensions",
    },
  ];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.pageContent}>
        <div className={styles.dashboard}>
          <div className={styles.dashboardHeader}>
            <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
            <p className={styles.dashboardSubtitle}>Manage platform operations and moderation</p>
          </div>
          
          <div className={styles.dashboardCards}>
            {dashboardItems.map((item) => (
              <div 
                key={item.id}
                className={styles.dashboardCard}
                onClick={() => navigate(item.route)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(item.route);
                  }
                }}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardIcon}>{item.icon}</div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDescription}>
                    {item.description}
                  </p>
                </div>
                <div className={styles.cardArrow}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;