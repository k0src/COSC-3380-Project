import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { MiniStatPanel } from "@components";
import type { DataReportParams } from "@types";
import styles from "./EngagementVelocityPanel.module.css";

export interface EngagementVelocityPanelProps {
  params: DataReportParams;
}

const calculateEngagementVelocityChangePercent = (timeline: any[]): number => {
  if (timeline.length < 2) return 0;
  const firstHalf = timeline
    .slice(0, Math.floor(timeline.length / 2))
    .reduce((sum, d) => sum + d.likes + d.comments, 0);
  const secondHalf = timeline
    .slice(Math.floor(timeline.length / 2))
    .reduce((sum, d) => sum + d.likes + d.comments, 0);
  return ((secondHalf - firstHalf) / firstHalf) * 100;
};

const EngagementVelocityPanel: React.FC<EngagementVelocityPanelProps> = ({
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
        title="Engagement Velocity"
        value="N/A"
        subtitle="Error loading data"
      />
    );
  }

  const totalEngagement = timelineData.reduce(
    (sum, d) => sum + d.likes + d.comments,
    0
  );
  const avgPerDay = totalEngagement / timelineData.length;

  return (
    <MiniStatPanel
      title="Engagement Velocity"
      value={avgPerDay.toFixed(0)}
      subtitle="avg interactions/day"
      trend={timelineData.map((d) => d.likes + d.comments)}
      trendColor="var(--color-green-ui)"
      showArea
      changePercent={calculateEngagementVelocityChangePercent(timelineData)}
      changeLabel="vs first half"
    />
  );
};

export default memo(EngagementVelocityPanel);
