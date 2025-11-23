import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ReportSection.module.css";
import type { ReportEntity } from "@types";
import type { Report } from "../../../api/admin.api";

interface ReportsListProps {
  ReportEntity: ReportEntity;
  reports: Report[];
  loading: boolean;
  error: string | null;
  onAction: (reportId: string, action: "suspend" | "reject") => void; 
}

const ReportsList: React.FC<ReportsListProps> = ({
  ReportEntity,
  reports,
  loading,
  error,
  onAction,
}) => {
  const navigate = useNavigate();

  if (loading) return <div className={styles.loading}>Loading reports...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!reports.length) return <div className={styles.empty}>No reports found for this category.</div>;

  const getEntityRoute = (reportedId: string) => {
    // Map ReportEntity to route prefix
    const routeMap: Record<ReportEntity, string> = {
      USER: "users",
      SONG: "songs",
      ALBUM: "albums",
      PLAYLIST: "playlists",
      ARTIST  : "artists"
    };
    
    const routePrefix = routeMap[ReportEntity];
    return `/${routePrefix}/${reportedId}`;
  };

  const handleReportedClick = (reportedId: string) => {
    const route = getEntityRoute(reportedId);
    navigate(route);
  };

  return (
    <div className={styles.reportListSection}>
      <h3 className={styles.reportListTitle}>
        {ReportEntity} Reports
      </h3>

      <ul className={styles.reportList}>
        {reports.map((report, index) => (
          <li key={index} className={styles.reportListItem}>
            <div className={styles.reportRow}>
              <div className={styles.reportDetails}>
                <p><strong>Reporter:</strong> {report.reporter_username || report.reporter_id}</p>
                <p>
                  <strong>Reported:</strong>{" "}
                  <button
                    type="button"
                    className={styles.reportedLink}
                    onClick={() => handleReportedClick(report.reported_id)}
                    aria-label={`View details for ${report.reported_name || report.reported_id}`}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  >
                    {report.reported_name || report.reported_id}
                  </button>
                </p>
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