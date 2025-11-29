import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { LuSparkles } from "react-icons/lu";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import type { DataReportParams, UserGrowthData, RetentionCohort } from "@types";
import styles from "./DataReportStoryPanel.module.css";
import { formatNumber } from "@util";

export interface DataReportStoryPanelProps {
  params: DataReportParams;
}

const generateUserGrowthStory = (
  growthData: UserGrowthData[],
  cohorts: RetentionCohort[],
  avgTime: number,
  usersWithoutStreams: number
): React.ReactNode => {
  if (growthData.length === 0) {
    return "No user growth data available for the selected period.";
  }

  const latestPeriod = growthData[growthData.length - 1];
  const totalNew = growthData.reduce((sum, d) => sum + d.newUsers, 0);

  return (
    <>
      During this period, CoogMusic gained{" "}
      <strong>{totalNew.toLocaleString()}</strong> new users.{" "}
      {latestPeriod && latestPeriod.growthRate !== 0 && (
        <>
          The most recent period showed a{" "}
          {latestPeriod.growthRate > 0 ? "growth" : "decline"} of{" "}
          <strong>{Math.abs(latestPeriod.growthRate).toFixed(1)}%</strong>.{" "}
        </>
      )}
      {cohorts.length > 0 && cohorts[0] && cohorts[0].cohortSize > 0 && (
        <>
          The most recent cohort (<strong>{cohorts[0].cohortSize}</strong>{" "}
          users) has a 28-day retention rate of{" "}
          <strong>
            {((cohorts[0].day28 / cohorts[0].cohortSize) * 100).toFixed(1)}%
          </strong>
          .{" "}
        </>
      )}
      On average, new users take <strong>{formatNumber(avgTime)}</strong> hours
      to play their first song.
      {usersWithoutStreams > 0 && (
        <>
          {" "}
          Note: <strong>{usersWithoutStreams}</strong> users have not streamed
          any songs yet.
        </>
      )}
    </>
  );
};

const DataReportStoryPanel: React.FC<DataReportStoryPanelProps> = ({
  params,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      growth: () => dataApi.getUserGrowthData(params),
      cohorts: () => dataApi.getRetentionCohorts(params),
      avgTime: () => dataApi.getAverageTimeToFirstStream(params),
    },
    [JSON.stringify(params)]
  );

  const story = useMemo(() => {
    if (!data?.growth || !data?.cohorts || !data?.avgTime) {
      return null;
    }

    return generateUserGrowthStory(
      data.growth,
      data.cohorts,
      data.avgTime.averageTimeToFirstStream,
      data.avgTime.usersWithoutStreams
    );
  }, [data]);

  const hasData = data?.growth && data?.cohorts && data?.avgTime;

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error || !hasData) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <LuSparkles className={styles.icon} />
        <span className={styles.title}>Growth & Retention</span>
      </div>
      <span className={styles.story}>{story}</span>
    </div>
  );
};

export default memo(DataReportStoryPanel);
