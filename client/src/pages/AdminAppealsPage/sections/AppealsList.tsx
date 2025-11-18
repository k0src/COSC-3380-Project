import React from "react";
import styles from "./AppealsSection.module.css";
import type { AppealType } from "./AppealsDropdown";
import type { AdminAppeal } from "../../../api/admin-appeals.api";

interface AppealsListProps {
  appealType: AppealType;
  appeals: AdminAppeal[];
  loading: boolean;
  error: string | null;
  onAction: (appeal: AdminAppeal, action: "approve" | "reject") => void; 
}

const AppealsList: React.FC<AppealsListProps> = ({
  appealType,
  appeals,
  loading,
  error,
  onAction,
}) => {
  if (loading) return <div className={styles.loading}>Loading appeals...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!appeals.length) return <div className={styles.empty}>No appeals found for this category.</div>;

  const getAppealTitle = (appealType: AppealType) => {
    switch (appealType) {
      case 'user':
        return 'User Account Appeals';
      case 'song':
        return 'Song Appeals';
      case 'album':
        return 'Album Appeals';
      case 'playlist':
        return 'Playlist Appeals';
      default:
        return 'Appeals';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return '#f59e0b'; // yellow
      case 'APPROVED':
        return '#10b981'; // green
      case 'REJECTED':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className={styles.appealsListSection}>
      <h3 className={styles.appealsListTitle}>
        {getAppealTitle(appealType)}
      </h3>

      <ul className={styles.appealsList}>
        {appeals.map((appeal, index) => (
          <li key={`${appeal.user_id}-${appeal.submitted_at}-${index}`} className={styles.appealsListItem}>
            <div className={styles.appealRow}>
              <div className={styles.appealDetails}>
                <div className={styles.appealHeader}>
                  <p><strong>User:</strong> {appeal.username || appeal.user_id}</p>
                  {appealType !== 'user' && (
                    <p><strong>{appealType.charAt(0).toUpperCase() + appealType.slice(1)}:</strong> {appeal.entity_name || appeal.entity_id}</p>
                  )}
                  {appealType !== 'user' && appeal.entity_owner && (
                    <p><strong>Owner:</strong> {appeal.entity_owner}</p>
                  )}
                </div>
                
                <div className={styles.appealContent}>
                  <p><strong>Report Type:</strong> {appeal.report_type}</p>
                  <p><strong>Reason:</strong> {appeal.reason}</p>
                  <p><strong>Submitted:</strong> {formatDate(appeal.submitted_at)}</p>
                  <p>
                    <strong>Status:</strong> 
                    <span 
                      className={styles.appealStatus}
                      style={{ color: getStatusColor(appeal.appeal_status) }}
                    >
                      {appeal.appeal_status.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>

              {appeal.appeal_status === 'PENDING_REVIEW' && (
                <div className={styles.appealActions}>
                  <button
                    className={`${styles.actionButton} ${styles.approveButton}`}
                    onClick={() => onAction(appeal, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.rejectButton}`}
                    onClick={() => onAction(appeal, "reject")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AppealsList;