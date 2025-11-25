import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { BigStatPanel } from "@components";
import type { DataReportParams } from "@types";
import styles from "./AvgSessionLengthCard.module.css";

export interface AvgSessionLengthCardProps {
  params: DataReportParams;
}

const AvgSessionLengthCard: React.FC<AvgSessionLengthCardProps> = ({
  params,
}) => {
  const { data, loading, error } = useAsyncData(
    { engagement: () => dataApi.getEngagementMetrics(params) },
    [JSON.stringify(params)]
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return null;
  }

  const avgSessionMinutes = data?.engagement?.averageSessionLength ?? 0;

  if (!data?.engagement) {
    return null;
  }
  const displayValue =
    typeof avgSessionMinutes === "number" && !isNaN(avgSessionMinutes)
      ? avgSessionMinutes.toFixed(1)
      : "0.0";

  return (
    <BigStatPanel
      title="Avg. Session Length"
      value={displayValue}
      subtitle="minutes per session"
      trend="neutral"
    />
  );
};

export default memo(AvgSessionLengthCard);
