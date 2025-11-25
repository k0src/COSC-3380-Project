import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { BigStatPanel } from "@components";
import { formatNumber, formatHour } from "@util";
import type { DataReportParams } from "@types";
import { LuClock } from "react-icons/lu";
import styles from "./PeakHourPanel.module.css";

export interface PeakHourPanelProps {
  params: DataReportParams;
}

const PeakHourPanel: React.FC<PeakHourPanelProps> = ({ params }) => {
  const { data, loading, error } = useAsyncData(
    { peakHour: () => dataApi.getPeakActivityHour(params) },
    [JSON.stringify(params)]
  );

  const peakHourData = data?.peakHour ?? {};

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={25} />
      </div>
    );
  }

  if (error || !peakHourData.hour) {
    return (
      <BigStatPanel
        icon={LuClock}
        title="Most Active Hour"
        value="N/A"
        subtitle="Error loading data"
        trend="neutral"
        trendValue="N/A"
      />
    );
  }

  return (
    <BigStatPanel
      icon={LuClock}
      title="Most Active Hour"
      value={`${formatHour(peakHourData.hour)}`}
      subtitle={`${formatNumber(peakHourData.totalActivity)} total activities`}
      trend="neutral"
      trendValue="Consistent"
    />
  );
};

export default memo(PeakHourPanel);
