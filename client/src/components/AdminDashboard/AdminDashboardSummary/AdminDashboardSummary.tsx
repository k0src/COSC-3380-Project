import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { HorizontalRule } from "@components";
import { formatLocaleDate, formatNumber, formatPercentage } from "@util";
import type { ExecutiveSummary, DataReportParams } from "@types";
import styles from "./AdminDashboardSummary.module.css";

export interface AdminDashboardSummaryProps {
  params: DataReportParams;
}

const AdminDashboardSummary: React.FC<AdminDashboardSummaryProps> = ({
  params,
}) => {
  const paramsString = JSON.stringify(params);

  const { data, loading, error } = useAsyncData(
    {
      summary: () => dataApi.getExecutiveSummaryData(params),
    },
    [params],
    {
      cacheKey: `admin_dashboard_summary_${paramsString}`,
    }
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorText}>Error loading summary.</span>
      </div>
    );
  }

  if (!data?.summary) {
    return null;
  }

  const summary: ExecutiveSummary = data.summary;

  return (
    <div className={styles.summaryPanel}>
      <span className={styles.summaryTitle}>Executive Summary</span>
      <HorizontalRule />
      <div className={styles.summaryContent}>
        <div className={styles.summarySection}>
          <span className={styles.summaryText}>
            Between {formatLocaleDate(summary.timeRange.startDate)} and{" "}
            {formatLocaleDate(summary.timeRange.endDate)}, the CoogMusic
            platform recorded{" "}
            <strong>{formatNumber(summary.totalStreams)}</strong> total streams
            from <strong>{formatNumber(summary.activeUsers)}</strong> active
            users across <strong>{formatNumber(summary.uniqueSongs)}</strong>{" "}
            unique songs. The platform engagement rate stood at{" "}
            <strong>{formatPercentage(summary.engagementRate)}</strong>, with
            users averaging{" "}
            <strong>{formatPercentage(summary.avgStreamsPerUser)}</strong>{" "}
            streams per person during this period.
          </span>
        </div>

        <div className={styles.summarySection}>
          <span className={styles.summaryText}>
            User activity{" "}
            {summary.userTrend.direction === "growth"
              ? "increased"
              : "decreased"}{" "}
            by <strong>{formatPercentage(summary.userTrend.percent)}</strong> (
            {summary.userTrend.delta > 0 ? "+" : ""}
            {formatNumber(summary.userTrend.delta)} users) compared to the
            previous period
            {summary.userTrend.isSignificant && (
              <>
                , representing a <strong>statistically significant</strong>{" "}
                change
              </>
            )}
            . Total streams{" "}
            {summary.streamTrend.direction === "growth" ? "grew" : "declined"}{" "}
            by <strong>{formatPercentage(summary.streamTrend.percent)}</strong>,
            indicating{" "}
            {summary.streamTrend.direction === "growth"
              ? "increased"
              : "decreased"}{" "}
            platform usage.
          </span>
          <span className={styles.summaryText}>
            {summary.songChange.delta !== 0 && (
              <>
                The catalog saw {Math.abs(summary.songChange.delta)}{" "}
                {summary.songChange.delta > 0 ? "more" : "fewer"} unique songs
                streamed compared to the previous period (
                {summary.songChange.percent > 0 ? "+" : ""}
                {formatPercentage(summary.songChange.percent)}).{" "}
              </>
            )}
            Users demonstrated{" "}
            <strong>
              {summary.avgStreamsPerUser >= 10 ? "strong" : "moderate"}
            </strong>{" "}
            listening behavior with an average of{" "}
            <strong>{formatNumber(summary.avgStreamsPerUser)}</strong> streams
            per active user.
          </span>
          <span className={styles.summaryText}>
            {summary.engagementChange.isLarge ? (
              <>
                Platform engagement{" "}
                {summary.engagementChange.percent > 0
                  ? "improved significantly"
                  : "declined noticeably"}
                , {summary.engagementChange.percent > 0 ? "up" : "down"}{" "}
                <strong>
                  {formatPercentage(Math.abs(summary.engagementChange.percent))}
                </strong>{" "}
                to <strong>{formatPercentage(summary.engagementRate)}</strong>.{" "}
                {summary.engagementChange.percent > 0
                  ? "This suggests users are more actively interacting with content through likes and comments."
                  : "This may indicate a need to re-engage the user base with fresh content or features."}
              </>
            ) : (
              <>
                Engagement remained relatively stable at{" "}
                <strong>{formatPercentage(summary.engagementRate)}</strong> (
                {summary.engagementChange.percent > 0 ? "+" : ""}
                {formatPercentage(summary.engagementChange.percent)}
                ).
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default memo(AdminDashboardSummary);
