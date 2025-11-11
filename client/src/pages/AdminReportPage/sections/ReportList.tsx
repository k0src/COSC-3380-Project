import React from "react";
import styles from "./ReportSection.module.css";
import type { ReportType } from "./ReportDrpdown";
import type { Report } from "../../../api/admin.api";

interface ReportsListProps {
  reportType: ReportType;
  reports: Report[];
  loading: boolean;
  error: string | null;
  onAction: (reportId: string, action: "suspend" | "reject") => void; 
}

const ReportsList: React.FC<ReportsListProps> = ({
  reportType,
  reports,
  loading,
  error,
  onAction,
}) => {
  if (loading) return <div className={styles.loading}>Loading reports...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!reports.length) return <div className={styles.empty}>No reports found for this category.</div>;

  return (
    <div className={styles.reportListSection}>
      <h3 className={styles.reportListTitle}>
        {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Reports
      </h3>

      <ul className={styles.reportList}>
        {reports.map((report, index) => (
          <li key={index} className={styles.reportListItem}>
            <div className={styles.reportRow}>
              <div className={styles.reportDetails}>
                <p><strong>Reporter:</strong> {report.reporter_username || report.reporter_id}</p>
                <p><strong>Reported:</strong> {report.reported_username || report.reported_id}</p>
                <p><strong>Reason:</strong> {report.report_type}</p>
                <p><strong>Description:</strong> {report.description || "—"}</p>
                <p><strong>Status:</strong> {report.report_status?.toUpperCase()}</p>
              </div>

              <div className={styles.reportActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => onAction(report.report_id, "suspend")}
                >
                  Suspend
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => onAction(report.report_id, "reject")}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReportsList;