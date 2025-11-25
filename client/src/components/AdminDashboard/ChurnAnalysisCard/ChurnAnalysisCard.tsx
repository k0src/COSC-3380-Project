import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import type { DataReportParams } from "@types";
import styles from "./ChurnAnalysisCard.module.css";

export interface ChurnAnalysisCardProps {
  params: DataReportParams;
}

const ChurnAnalysisCard: React.FC<ChurnAnalysisCardProps> = ({ params }) => {
  const { data, loading, error } = useAsyncData(
    { churn: () => dataApi.getChurnMetrics(params) },
    [JSON.stringify(params)]
  );

  const churnData = data?.churn;

  if (loading) {
    return (
      <div className={styles.churnSection}>
        <h2 className={styles.sectionTitle}>Churn Analysis</h2>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error || !churnData) {
    return (
      <div className={styles.churnSection}>
        <h2 className={styles.sectionTitle}>Churn Analysis</h2>
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>Error loading churn data</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.churnSection}>
      <span className={styles.sectionTitle}>Churn Analysis</span>
      <div className={styles.churnDataSection}>
        <div className={styles.churnGrid}>
          <div className={styles.churnCard}>
            <span className={styles.churnLabel}>Churn Rate</span>
            <span className={styles.churnValue}>
              {churnData.churnRate.toFixed(1)}%
            </span>
            <span className={styles.churnSubtext}>Users inactive 30+ days</span>
          </div>
          <div className={styles.churnCard}>
            <span className={styles.churnLabel}>Inactive Users</span>
            <span className={styles.churnValue}>
              {churnData.inactiveUsers.toLocaleString()}
            </span>
            <span className={styles.churnSubtext}>No activity in 30+ days</span>
          </div>
          <div className={styles.churnCard}>
            <span className={styles.churnLabel}>Reactivated Users</span>
            <span
              className={styles.churnValue}
              style={{ color: "var(--color-green)" }}
            >
              {churnData.reactivatedUsers.toLocaleString()}
            </span>
            <span className={styles.churnSubtext}>Returned this period</span>
          </div>
          <div className={styles.churnCard}>
            <span className={styles.churnLabel}>
              Avg Days Since Last Stream
            </span>
            <span className={styles.churnValue}>
              {churnData.avgDaysSinceLastStream.toFixed(1)}
            </span>
            <span className={styles.churnSubtext}>
              Days since last activity
            </span>
          </div>
        </div>
        {churnData.story && (
          <div className={styles.churnStory}>
            <span className={styles.churnStoryText}>{churnData.story}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ChurnAnalysisCard);
