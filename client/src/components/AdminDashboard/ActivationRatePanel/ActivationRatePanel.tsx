import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { MiniStatPanel } from "@components";
import type { DataReportParams, RetentionCohort } from "@types";
import styles from "./ActivationRatePanel.module.css";

export interface ActivationRatePanelProps {
  params: DataReportParams;
}

const calculateActivationRate = (cohorts: RetentionCohort[]): number => {
  if (cohorts.length === 0) return 0;
  const avgDay1 =
    cohorts.reduce(
      (sum, c) => sum + (c.cohortSize > 0 ? (c.day1 / c.cohortSize) * 100 : 0),
      0
    ) / cohorts.length;
  return avgDay1;
};

const ActivationRatePanel: React.FC<ActivationRatePanelProps> = ({
  params,
}) => {
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
        title="Activation Rate"
        value="N/A"
        subtitle="Error loading data"
      />
    );
  }

  const activationRate = calculateActivationRate(cohortsData);
  const trend = cohortsData.map((c) =>
    c.cohortSize > 0 ? (c.day1 / c.cohortSize) * 100 : 0
  );

  return (
    <MiniStatPanel
      title="Activation Rate"
      value={`${activationRate.toFixed(1)}%`}
      subtitle="users active on day 1"
      trend={trend}
      trendColor="var(--color-accent)"
      showArea
    />
  );
};

export default memo(ActivationRatePanel);
