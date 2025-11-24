import { memo, useMemo, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { AdminManageReports, AdminManageAppeals } from "@components";
import styles from "./AdminReportsAndAppealsPage.module.css";
import classNames from "classnames";

type TabType = "reports" | "appeals";
const VALID_TABS = ["reports", "appeals"] as const;

const TabButton = memo(
  ({
    tab,
    isActive,
    onClick,
  }: {
    tab: { id: TabType; label: string };
    isActive: boolean;
    onClick: (id: TabType) => void;
  }) => (
    <button
      className={classNames(styles.tabButton, {
        [styles.tabButtonActive]: isActive,
      })}
      onClick={() => onClick(tab.id)}
    >
      {tab.label}
    </button>
  )
);

const AdminReportsAndAppealsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();

  const isValidTab = (tab: string | undefined): tab is TabType => {
    return VALID_TABS.includes(tab as TabType);
  };

  const activeTab: TabType = isValidTab(tab) ? tab : "reports";

  useEffect(() => {
    if (!tab) {
      navigate("/admin/reports-appeals/reports", { replace: true });
    } else if (!isValidTab(tab)) {
      navigate("/admin/reports-appeals/reports", { replace: true });
    }
  }, [tab, navigate]);

  const tabs = useMemo(
    () => [
      { id: "reports" as const, label: "Reports" },
      { id: "appeals" as const, label: "Appeals" },
    ],
    []
  );

  const handleTabClick = useCallback(
    (tab: TabType) => {
      navigate(`/admin/reports-appeals/${tab}`);
    },
    [navigate]
  );

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    navigate("/login");
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Reports & Appeals - Admin - CoogMusic</title>
      </Helmet>

      <div className={styles.pageLayout}>
        <span className={styles.pageTitle}>Reports & Appeals</span>

        <div className={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={handleTabClick}
            />
          ))}
        </div>

        {activeTab === "reports" && <AdminManageReports />}
        {activeTab === "appeals" && <AdminManageAppeals />}
      </div>
    </>
  );
};

export default memo(AdminReportsAndAppealsPage);
