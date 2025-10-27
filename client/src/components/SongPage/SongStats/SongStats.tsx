import { useMemo, memo, useCallback } from "react";
import { useAsyncData } from "@hooks";
import { songApi } from "@api";
import { PuffLoader } from "react-spinners";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import type { SparkLineChartProps } from "@mui/x-charts/SparkLineChart";
import {
  areaElementClasses,
  lineElementClasses,
} from "@mui/x-charts/LineChart";
import { chartsAxisHighlightClasses } from "@mui/x-charts/ChartsAxisHighlight";
import styles from "./SongStats.module.css";

const CHART_HEIGHT = 80;
const CHART_WIDTH = 330;
const CHART_COLOR = "rgb(213, 49, 49)";

const CHART_SX = {
  [`& .${areaElementClasses.root}`]: { opacity: 0.2 },
  [`& .${lineElementClasses.root}`]: { strokeWidth: 3 },
  [`& .${chartsAxisHighlightClasses.root}`]: {
    stroke: CHART_COLOR,
    strokeDasharray: "none",
    strokeWidth: 2,
  },
};

const CHART_SLOT_PROPS = {
  lineHighlight: { r: 4 },
};

const CLIP_AREA_OFFSET = { top: 2, bottom: 2 };

export interface SongStatsProps {
  songId: string;
}

const SongStats: React.FC<SongStatsProps> = ({ songId }) => {
  const { data, loading, error } = useAsyncData(
    {
      weeklyPlays: () => songApi.getWeeklyPlays(songId),
    },
    [songId],
    { cacheKey: `weekly_plays_${songId}` }
  );

  const playsData = data?.weeklyPlays || { weeks: [], plays: [] };

  const domainLimit = useCallback(
    (_: any, maxValue: number) => ({
      min: -maxValue / 6,
      max: maxValue,
    }),
    []
  );

  const sparkLineSettings = useMemo<SparkLineChartProps>(
    () => ({
      data: playsData.plays,
      baseline: "min",
      xAxis: { id: "week-axis", data: playsData.weeks },
      yAxis: {
        domainLimit: domainLimit,
      },
      sx: CHART_SX,
      slotProps: CHART_SLOT_PROPS,
      clipAreaOffset: CLIP_AREA_OFFSET,
      axisHighlight: { x: "line" },
    }),
    [playsData.plays, playsData.weeks]
  );

  if (!playsData.plays.length || !playsData.weeks.length || error) {
    return (
      <div className={styles.songStatsContainer}>
        <span className={styles.statsText}>Weekly Plays</span>
        <div className={styles.noDataMessage}>No play data available</div>
      </div>
    );
  }

  return (
    <div className={styles.songStatsContainer}>
      <span className={styles.statsText}>Weekly Plays</span>
      {loading ? (
        <div className={styles.loaderContainer}>
          <PuffLoader color={CHART_COLOR} size={40} />
        </div>
      ) : (
        <SparkLineChart
          height={CHART_HEIGHT}
          width={CHART_WIDTH}
          area
          showHighlight
          color={CHART_COLOR}
          className={styles.playsChart}
          aria-label="Weekly plays chart"
          {...sparkLineSettings}
        />
      )}
    </div>
  );
};

export default memo(SongStats);
