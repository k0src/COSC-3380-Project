import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { BigStatPanel } from "@components";
import type { DataReportParams } from "@types";
import { LuClock } from "react-icons/lu";
import styles from "./AvgTimeCard.module.css";

export interface AvgTimeCardProps {
  params: DataReportParams;
}

const AvgTimeCard: React.FC<AvgTimeCardProps> = ({ params }) => {
  const { data, loading, error } = useAsyncData(
    { avgTime: () => dataApi.getAverageTimeToFirstStream(params) },
    [JSON.stringify(params)]
  );

  const avgTimeData = data?.avgTime;

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={25} />
      </div>
    );
  }

  if (error || !avgTimeData) {
    return (
      <BigStatPanel
        icon={LuClock}
        title="Avg Time to First Stream"
        value="N/A"
        subtitle="Error loading data"
        trend="neutral"
        trendValue="N/A"
      />
    );
  }

  const hours = avgTimeData.averageTimeToFirstStream;
  const displayValue =
    hours < 1
      ? Math.round(hours * 60) + "m"
      : hours < 24
      ? hours.toFixed(1) + "h"
      : (hours / 24).toFixed(1) + "d";

  return (
    <BigStatPanel
      icon={LuClock}
      title="Avg Time to First Stream"
      value={displayValue}
      subtitle={avgTimeData.usersWithoutStreams + " users haven't streamed"}
    />
  );
};

export default memo(AvgTimeCard);
