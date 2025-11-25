import { memo, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./DataReportsNav.module.css";
import classNames from "classnames";
import { LuLayoutDashboard, LuTrendingUp, LuActivity } from "react-icons/lu";

type TabType = "executive-overview" | "user-growth" | "engagement";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
  path: string;
}

const DataReportsNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = useMemo<Tab[]>(
    () => [
      {
        id: "executive-overview",
        label: "Overview",
        icon: LuLayoutDashboard,
        path: "/admin/data-reports",
      },
      {
        id: "user-growth",
        label: "User Growth & Analytics",
        icon: LuTrendingUp,
        path: "/admin/data-reports/user-growth",
      },
      {
        id: "engagement",
        label: "Engagement",
        icon: LuActivity,
        path: "/admin/data-reports/engagement",
      },
    ],
    []
  );

  const activeTab = useMemo(() => {
    const currentPath = location.pathname;
    const tab = tabs.find((t) => t.path === currentPath);
    return tab?.id || "executive-overview";
  }, [location.pathname, tabs]);

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className={styles.tabContainer}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={classNames(styles.tabButton, {
              [styles.tabButtonActive]: isActive,
            })}
            onClick={() => handleTabClick(tab.path)}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon /> {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default memo(DataReportsNav);
