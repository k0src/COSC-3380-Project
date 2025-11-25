import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { MiniStatPanel } from "@components";
import type { DataReportParams } from "@types";
import styles from "./PeakActivityDayPanel.module.css";

export interface PeakActivityDayPanelProps {
  params: DataReportParams;
}

const findPeakActivityDay = (timeline: any[]): string => {
  const maxStreams = Math.max(...timeline.map((d) => d.streams));
  const peakDay = timeline.find((d) => d.streams === maxStreams);
  return peakDay
    ? new Date(peakDay.period).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "N/A";
};

const PeakActivityDayPanel: React.FC<PeakActivityDayPanelProps> = ({
  params,
}) => {
  const { data, loading, error } = useAsyncData(
    { timeline: () => dataApi.getActivityTimeline(params) },
    [JSON.stringify(params)]
  );

  const timelineData = data?.timeline ?? [];

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={25} />
      </div>
    );
  }

  if (error || timelineData.length === 0) {
    return (
      <MiniStatPanel
        title="Peak Activity Day"
        value="N/A"
        subtitle="Error loading data"
      />
    );
  }

  const maxStreams = Math.max(...timelineData.map((d) => d.streams));

  return (
    <MiniStatPanel
      title="Peak Activity Day"
      value={findPeakActivityDay(timelineData)}
      subtitle={`${maxStreams.toLocaleString()} streams`}
      trend={timelineData.map((d) => d.streams)}
      trendColor="var(--color-accent)"
      showArea
    />
  );
};

export default memo(PeakActivityDayPanel);
