import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { MiniStatPanel } from "@components";
import type { DataReportParams, RetentionCohort } from "@types";
import styles from "./RetentionRatePanel.module.css";

export interface RetentionRatePanelProps {
  params: DataReportParams;
}

const calculateRetentionRate = (cohorts: RetentionCohort[]): number => {
  if (cohorts.length === 0) return 0;
  const avgDay28 =
    cohorts.reduce(
      (sum, c) => sum + (c.cohortSize > 0 ? (c.day28 / c.cohortSize) * 100 : 0),
      0
    ) / cohorts.length;
  return avgDay28;
};

const calculateRetentionChange = (cohorts: RetentionCohort[]): number => {
  if (cohorts.length < 2) return 0;
  const firstCohort = cohorts[0];
  const lastCohort = cohorts[cohorts.length - 1];
  const firstRate =
    firstCohort.cohortSize > 0
      ? (firstCohort.day28 / firstCohort.cohortSize) * 100
      : 0;
  const lastRate =
    lastCohort.cohortSize > 0
      ? (lastCohort.day28 / lastCohort.cohortSize) * 100
      : 0;
  return firstRate > 0 ? ((lastRate - firstRate) / firstRate) * 100 : 0;
};

const RetentionRatePanel: React.FC<RetentionRatePanelProps> = ({ params }) => {
  const { data, loading, error } = useAsyncData(
    { cohorts: () => dataApi.getRetentionCohorts(params) },
    [JSON.stringify(params)]
  );

  const cohortsData = data?.cohorts ?? [];

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={25} />
      </div>
    );
  }

  if (error || cohortsData.length === 0) {
    return (
      <MiniStatPanel
        title="28-Day Retention"
        value="N/A"
        subtitle="Error loading data"
      />
    );
  }

  const retentionRate = calculateRetentionRate(cohortsData);
  const trend = cohortsData.map((c) =>
    c.cohortSize > 0 ? (c.day28 / c.cohortSize) * 100 : 0
  );
  const changePercent = calculateRetentionChange(cohortsData);

  return (
    <MiniStatPanel
      title="28-Day Retention"
      value={`${retentionRate.toFixed(1)}%`}
      subtitle="avg across all cohorts"
      trend={trend}
      trendColor="var(--color-green-ui)"
      showArea
      changePercent={changePercent}
      changeLabel="vs oldest cohort"
    />
  );
};

export default memo(RetentionRatePanel);
